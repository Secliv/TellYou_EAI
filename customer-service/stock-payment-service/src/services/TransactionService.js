const axios = require('axios');
const crypto = require('crypto');
const TransactionModel = require('../models/TransactionsModel');

// Generate unique ID helper
function generateId() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

class TransactionService {
    /**
     * Create order (Entry point untuk sistem eksternal)
     */
    static async createTransaction(orderData) {
        const transactionId = `TXN-${Date.now()}-${generateId()}`;

        try {
        console.log(`📝 Creating transaction: ${transactionId}`);

        // 1. Validate request data
        this.validateOrderData(orderData);

        // 2. Check inventory availability
        const stockCheck = await this.checkInventory(orderData.items || []);
        
        if (!stockCheck.available) {
            throw new Error('Insufficient stock for requested items');
        }

        // 3. Call order service to create order
        const orderResponse = await this.callOrderService(orderData);

        // 4. Calculate total cost
        const totalCost = this.calculateTotalCost(orderData.items || [], orderData.total_amount);

        // 5. Create payment in Payment Service (SNP acts as gateway)
        let paymentResponse = null;
        try {
            paymentResponse = await this.createPaymentInPaymentService({
                orderId: parseInt(orderResponse.order_id),
                customerId: 0, // Default for external orders
                customerName: orderData.source_system === 'TOKO_KUE_GATEWAY' 
                    ? 'Toko Kue Integration' 
                    : orderData.source_system || 'External System',
                amount: totalCost,
                paymentMethod: 'transfer', // Default, can be updated later
                notes: `Transaction ID: ${transactionId}, External Order: ${orderData.external_order_id || 'N/A'}`
            });
            console.log(`✅ Payment created in Payment Service: ${paymentResponse.payment?.id}`);
        } catch (paymentError) {
            console.warn(`⚠️  Failed to create payment in Payment Service: ${paymentError.message}`);
            // Continue with transaction creation even if payment creation fails
            // Payment can be created later during confirmPayment
        }

        // 6. Save to fact table
        const transaction = await TransactionModel.createTransaction({
            transaction_id: transactionId,
            external_order_id: orderData.external_order_id || `EXT-${Date.now()}`,
            order_id: orderResponse.order_id,
            payment_id: paymentResponse?.payment?.id || null,
            total_cost: totalCost,
            payment_status: 'PENDING',
            stock_before: stockCheck.current_stock,
            source_system: orderData.source_system || 'EXTERNAL_SYSTEM',
            request_payload: orderData
        });

        // 7. Log audit
        await this.logAudit(transactionId, 'ORDER_CREATED', 'SYSTEM', {
            order_id: orderResponse.order_id,
            payment_id: paymentResponse?.payment?.id || null,
            total_cost: totalCost
        });

        console.log(`✅ Transaction created: ${transactionId}`);

        return {
            success: true,
            transaction_id: transactionId,
            order_id: orderResponse.order_id,
            total_cost: totalCost,
            payment_status: 'PENDING',
            message: 'Order created successfully. Please proceed to payment.'
        };

        } catch (error) {
        console.error(`❌ Transaction creation failed: ${error.message}`);
        
        // Log integration failure
        await this.logIntegrationStatus(
            transactionId, 
            'ORDER_SERVICE', 
            'FAILED', 
            orderData, 
            null, 
            error.message
        );
        
        throw error;
        }
    }

    /**
     * Confirm payment and update stock
     */
    static async confirmPayment(paymentData, context = null) {
        try {
        console.log(`💳 Processing payment for: ${paymentData.transaction_id}`);

        // 1. Get transaction
        const transaction = await TransactionModel.findByTransactionId(
            paymentData.transaction_id
        );

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.payment_status === 'SUCCESS') {
            throw new Error('Payment already processed for this transaction');
        }

        // 2. Process payment via payment service (SNP acts as gateway to update payment status)
        if (!transaction.payment_id) {
            throw new Error('Payment ID not found. Payment should have been created during transaction creation.');
        }

        const paymentResponse = await this.callPaymentService({
            transaction_id: paymentData.transaction_id,
            payment_id: transaction.payment_id,
            amount: transaction.total_cost,
            payment_method: paymentData.payment_method,
            currency: transaction.currency
        }, context);

        console.log('💳 Payment response status:', paymentResponse.status);
        console.log('💳 Payment response:', JSON.stringify(paymentResponse, null, 2));

        // paymentResponse.status will be 'confirmed' from Payment Service
        // Accept multiple status formats: 'confirmed', 'CONFIRMED', 'SUCCESS', 'success'
        const status = paymentResponse.status?.toLowerCase();
        if (status !== 'confirmed' && status !== 'success') {
            console.error('❌ Payment status check failed. Expected: confirmed or SUCCESS, Got:', paymentResponse.status);
            throw new Error(`Payment processing failed. Status: ${paymentResponse.status}`);
        }

        // 3. Update inventory (deduct stock)
        const requestPayload = typeof transaction.request_payload === 'string' 
            ? JSON.parse(transaction.request_payload) 
            : transaction.request_payload;
        
        const stockUpdate = await this.updateInventory(requestPayload.items || []);

        // 4. Update transaction record
        await TransactionModel.updateTransaction(paymentData.transaction_id, {
            payment_status: 'SUCCESS',
            payment_method: paymentData.payment_method,
            payment_id: paymentResponse.payment_id || transaction.payment_id,
            payment_completed_at: new Date(),
            stock_after: stockUpdate.updated_stock,
            response_payload: {
            payment: paymentResponse,
            stock: stockUpdate
            }
        });

        // 5. Update Order Status to 'delivered' (done) after payment confirmed
        if (transaction.order_id) {
            try {
                // Check if order_id is integer (not mock format "ORD-xxx")
                const orderId = transaction.order_id;
                const isIntegerId = /^\d+$/.test(String(orderId));
                
                if (!isIntegerId) {
                    console.warn(`⚠️  Order ID "${orderId}" is not a valid integer, skipping order status update`);
                } else {
                    console.log(`📦 Updating order status to 'delivered' for order_id: ${orderId}`);
                    
                    const orderStatusResponse = await axios.post(
                        `${process.env.ORDER_SERVICE_URL}/graphql`,
                        {
                            query: `
                                mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
                                    updateOrderStatus(id: $id, status: $status) {
                                        success
                                        message
                                        order {
                                            id
                                            status
                                            updatedAt
                                        }
                                    }
                                }
                            `,
                            variables: { 
                                id: String(orderId), // Ensure it's a string for GraphQL ID type
                                status: 'delivered'
                            }
                        },
                        { 
                            timeout: 5000,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (orderStatusResponse.data.errors) {
                        console.warn(`⚠️  Failed to update order status: ${orderStatusResponse.data.errors[0].message}`);
                    } else if (orderStatusResponse.data.data.updateOrderStatus.success) {
                        console.log(`✅ Order status updated to 'delivered' for order_id: ${orderId}`);
                        
                        await this.logIntegrationStatus(
                            paymentData.transaction_id,
                            'ORDER_SERVICE',
                            'SUCCESS',
                            { order_id: orderId, status: 'delivered' },
                            orderStatusResponse.data.data.updateOrderStatus
                        );
                    }
                }
            } catch (orderError) {
                console.warn(`⚠️  Failed to update order status after payment confirmation: ${orderError.message}`);
                // Don't throw error - payment is already confirmed, order status update is secondary
            }
        }

        // 6. Log audit
        await this.logAudit(paymentData.transaction_id, 'PAYMENT_CONFIRMED', 'SYSTEM', {
            payment_id: paymentResponse.payment_id,
            payment_method: paymentData.payment_method
        });

        console.log(`✅ Payment confirmed: ${paymentData.transaction_id}`);

        return {
            success: true,
            transaction_id: paymentData.transaction_id,
            payment_status: 'SUCCESS',
            payment_id: paymentResponse.payment_id,
            message: 'Payment confirmed and stock updated successfully'
        };

        } catch (error) {
        console.error(`❌ Payment confirmation failed: ${error.message}`);

        // Update transaction as failed
        await TransactionModel.updateTransaction(paymentData.transaction_id, {
            payment_status: 'FAILED',
            error_details: error.message
        });

        throw error;
        }
    }

    /**
     * Get all transactions
     */
    static async getTransactions(limit = 50, offset = 0) {
        return await TransactionModel.getAllTransactions(limit, offset);
    }

    /**
     * Get transaction by ID
     */
    static async getTransactionById(transactionId) {
        const transaction = await TransactionModel.findByTransactionId(transactionId);
        
        if (!transaction) {
        throw new Error('Transaction not found');
        }

        return transaction;
    }

    /**
     * Get transaction statistics
     */
    static async getStatistics() {
        return await TransactionModel.getStatistics();
    }

    // ============================================
    // HELPER METHODS - Integration dengan services lain
    // ============================================

    /**
     * Validate order data
     */
    static validateOrderData(data) {
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error('Order must contain at least one item');
        }

        data.items.forEach((item, index) => {
        if (!item.product_id) {
            throw new Error(`Item at index ${index} missing product_id`);
        }
        if (!item.quantity || item.quantity <= 0) {
            throw new Error(`Item at index ${index} has invalid quantity`);
        }
        if (!item.price || item.price <= 0) {
            throw new Error(`Item at index ${index} has invalid price`);
        }
        });
    }

    /**
     * Check inventory availability (call Inventory Service)
     */
    static async checkInventory(items) {
        try {
        const response = await axios.post(
            `${process.env.INVENTORY_SERVICE_URL}/api/check-stock`,
            { items },
            { timeout: 5000 }
        );

        await this.logIntegrationStatus(
            null, 
            'INVENTORY_SERVICE', 
            'SUCCESS', 
            { items }, 
            response.data
        );

        return {
            available: response.data.available,
            current_stock: response.data.stock
        };
        } catch (error) {
        // Explicit error handling with timeout and connection error detection
        const errorMessage = error.code === 'ECONNREFUSED' 
            ? 'Inventory service connection refused - service may not be running'
            : error.code === 'ETIMEDOUT'
            ? 'Inventory service request timeout - service may be slow or unavailable'
            : error.message || 'Unknown error';
        
        console.error(`❌ Inventory service error: ${errorMessage}`);
        
        // Log integration failure
        await this.logIntegrationStatus(
            null, 
            'INVENTORY_SERVICE', 
            'FAILED', 
            { items }, 
            null, 
            errorMessage
        );
        
        // In production, throw error; in development, use mock
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Inventory service unavailable: ${errorMessage}`);
        }
        
        // Mock untuk development only
        console.warn('⚠️  Using mock response for development');
        return {
            available: true,
            current_stock: items.map(item => ({ 
            product_id: item.product_id, 
            available_stock: 100,
            reserved_stock: 0
            }))
        };
        }
    }

    /**
     * Call Order Service via GraphQL
     */
    static async callOrderService(orderData) {
        try {
        console.log('📞 Calling Order Service via GraphQL...');
        
        // 1. Get product names from inventory service
        const orderItems = await Promise.all(
            (orderData.items || []).map(async (item) => {
                try {
                    // Query inventory service to get product name and unit
                    const inventoryResponse = await axios.post(
                        `${process.env.INVENTORY_SERVICE_URL}/graphql`,
                        {
                            query: `
                                query GetInventory($id: ID!) {
                                    inventory(id: $id) {
                                        success
                                        item {
                                            id
                                            name
                                            unit
                                        }
                                    }
                                }
                            `,
                            variables: { id: item.product_id }
                        },
                        { timeout: 3000 }
                    );

                    if (inventoryResponse.data?.data?.inventory?.success && inventoryResponse.data.data.inventory.item) {
                        const inventoryItem = inventoryResponse.data.data.inventory.item;
                        return {
                            ingredientId: parseInt(item.product_id),
                            name: inventoryItem.name || `Product ${item.product_id}`,
                            quantity: item.quantity,
                            price: item.price,
                            unit: inventoryItem.unit || 'pcs'
                        };
                    } else {
                        // Fallback if inventory service doesn't have the product
                        return {
                            ingredientId: parseInt(item.product_id),
                            name: `Product ${item.product_id}`,
                            quantity: item.quantity,
                            price: item.price,
                            unit: 'pcs'
                        };
                    }
                } catch (inventoryError) {
                    console.warn(`⚠️  Could not fetch inventory for product ${item.product_id}:`, inventoryError.message);
                    // Fallback if inventory query fails
                    return {
                        ingredientId: parseInt(item.product_id),
                        name: `Product ${item.product_id}`,
                        quantity: item.quantity,
                        price: item.price,
                        unit: 'pcs'
                    };
                }
            })
        );

        // 2. Prepare GraphQL mutation input
        const createOrderInput = {
            customerId: 0, // Default customer ID for external orders
            customerName: orderData.source_system === 'TOKO_KUE_GATEWAY' 
                ? 'Toko Kue Integration' 
                : orderData.source_system || 'External System',
            items: orderItems,
            notes: `External Order ID: ${orderData.external_order_id || 'N/A'}`,
            shippingAddress: 'Online Integration'
        };

        // 3. Call Order Service GraphQL endpoint
        const response = await axios.post(
            `${process.env.ORDER_SERVICE_URL}/graphql`,
            {
                query: `
                    mutation CreateOrder($input: CreateOrderInput!) {
                        createOrder(input: $input) {
                            success
                            message
                            order {
                                id
                                customerId
                                customerName
                                totalPrice
                                status
                                createdAt
                            }
                        }
                    }
                `,
                variables: { input: createOrderInput }
            },
            { 
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.errors) {
            const error = response.data.errors[0];
            // Check if it's an authentication error
            if (error.extensions && (error.extensions.code === 'UNAUTHENTICATED' || error.extensions.code === 'FORBIDDEN')) {
                throw new Error(`Order service authentication error: ${error.message}`);
            }
            throw new Error(error.message || 'GraphQL error');
        }

        const orderResponse = response.data.data.createOrder;

        if (!orderResponse.success || !orderResponse.order) {
            throw new Error(orderResponse.message || 'Failed to create order');
        }

        await this.logIntegrationStatus(
            null, 
            'ORDER_SERVICE', 
            'SUCCESS', 
            orderData, 
            orderResponse
        );

        // Return in format expected by createTransaction
        return {
            order_id: orderResponse.order.id,
            status: orderResponse.order.status,
            created_at: orderResponse.order.createdAt
        };
        } catch (error) {
        // Explicit error handling with timeout and connection error detection
        let errorMessage = error.message || 'Unknown error';
        
        if (error.response) {
            // HTTP error response
            const status = error.response.status;
            const statusText = error.response.statusText;
            const responseData = error.response.data;
            
            errorMessage = `Request failed with status code ${status}${statusText ? ` (${statusText})` : ''}`;
            
            if (responseData) {
                console.error(`Order service response:`, JSON.stringify(responseData).substring(0, 200));
                if (responseData.message) {
                    errorMessage += `: ${responseData.message}`;
                }
            }
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Order service connection refused - service may not be running';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Order service request timeout - service may be slow or unavailable';
        }
        
        console.error(`❌ Order service error: ${errorMessage}`);
        console.error(`Order service URL: ${process.env.ORDER_SERVICE_URL}/graphql`);
        
        // Log integration failure
        await this.logIntegrationStatus(
            null, 
            'ORDER_SERVICE', 
            'FAILED', 
            orderData, 
            null, 
            errorMessage
        );
        
        // In production, throw error; in development, use mock
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Order service unavailable: ${errorMessage}`);
        }
        
        // Mock untuk development only
        console.warn('⚠️  Using mock response for development');
        return {
            order_id: `ORD-${Date.now()}`,
            status: 'CREATED',
            created_at: new Date()
        };
        }
    }

    /**
     * Create Payment in Payment Service (via GraphQL)
     * SNP acts as gateway to create payment record
     */
    static async createPaymentInPaymentService(paymentData) {
        try {
            console.log(`💳 Creating payment in Payment Service for order: ${paymentData.orderId}`);
            
            const response = await axios.post(
                `${process.env.PAYMENT_SERVICE_URL}/graphql`,
                {
                    query: `
                        mutation CreatePayment($input: CreatePaymentInput!) {
                            createPayment(input: $input) {
                                success
                                message
                                payment {
                                    id
                                    orderId
                                    customerId
                                    customerName
                                    amount
                                    paymentMethod
                                    status
                                    createdAt
                                }
                            }
                        }
                    `,
                    variables: {
                        input: {
                            orderId: paymentData.orderId,
                            customerId: paymentData.customerId || 0,
                            customerName: paymentData.customerName,
                            amount: paymentData.amount,
                            paymentMethod: paymentData.paymentMethod || 'transfer',
                            notes: paymentData.notes
                        }
                    }
                },
                { 
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.errors) {
                const error = response.data.errors[0];
                // Check if it's an authentication error
                if (error.extensions && (error.extensions.code === 'UNAUTHENTICATED' || error.extensions.code === 'FORBIDDEN')) {
                    throw new Error(`Payment service authentication error: ${error.message}`);
                }
                throw new Error(error.message || 'GraphQL error');
            }

            const paymentResult = response.data.data.createPayment;

            if (!paymentResult.success || !paymentResult.payment) {
                throw new Error(paymentResult.message || 'Failed to create payment');
            }

            await this.logIntegrationStatus(
                null, 
                'PAYMENT_SERVICE', 
                'SUCCESS', 
                paymentData, 
                paymentResult
            );

            console.log(`✅ Payment created in Payment Service: ${paymentResult.payment.id}`);
            return paymentResult;
        } catch (error) {
            let errorMessage = error.message || 'Unknown error';
            
            if (error.response) {
                const status = error.response.status;
                const statusText = error.response.statusText;
                const responseData = error.response.data;
                
                errorMessage = `Request failed with status code ${status}${statusText ? ` (${statusText})` : ''}`;
                
                if (responseData) {
                    console.error(`Payment service response:`, JSON.stringify(responseData).substring(0, 200));
                    if (responseData.message) {
                        errorMessage += `: ${responseData.message}`;
                    }
                }
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Payment service connection refused - service may not be running';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Payment service request timeout - service may be slow or unavailable';
            }
            
            console.error(`❌ Payment service error: ${errorMessage}`);
            console.error(`Payment service URL: ${process.env.PAYMENT_SERVICE_URL}/graphql`);
            
            // Log integration failure
            await this.logIntegrationStatus(
                null, 
                'PAYMENT_SERVICE', 
                'FAILED', 
                paymentData, 
                null, 
                errorMessage
            );
            
            throw new Error(`Payment service unavailable: ${errorMessage}`);
        }
    }

    /**
     * Call Payment Service (for confirmPayment - update payment status)
     * SNP acts as gateway to update payment in Payment Service
     */
    static async callPaymentService(paymentData, context = null) {
        try {
            // Use payment_id from paymentData (passed from confirmPayment) or get from transaction
            let paymentId = paymentData.payment_id;
            
            if (!paymentId) {
                // Fallback: Get transaction to find payment_id
                const transaction = await TransactionModel.findByTransactionId(paymentData.transaction_id);
                if (!transaction || !transaction.payment_id) {
                    throw new Error('Payment ID not found in transaction. Payment may not have been created during transaction creation.');
                }
                paymentId = transaction.payment_id;
            }

            console.log(`💳 Confirming payment in Payment Service: ${paymentId}`);

            // Prepare headers with auth if available
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add authorization header if context is provided and has authHeader
            if (context && context.authHeader) {
                headers['Authorization'] = context.authHeader;
            }
            
            // Update payment status to confirmed via GraphQL
            const response = await axios.post(
                `${process.env.PAYMENT_SERVICE_URL}/graphql`,
                {
                    query: `
                        mutation ConfirmPayment($id: ID!) {
                            confirmPayment(id: $id) {
                                success
                                message
                                payment {
                                    id
                                    status
                                    paymentDate
                                }
                            }
                        }
                    `,
                    variables: {
                        id: String(paymentId)
                    }
                },
                { 
                    timeout: 5000,
                    headers: headers
                }
            );

            if (response.data.errors) {
                const error = response.data.errors[0];
                // Check if it's an authentication error
                if (error.extensions && (error.extensions.code === 'UNAUTHENTICATED' || error.extensions.code === 'FORBIDDEN')) {
                    throw new Error(`Payment service authentication error: ${error.message}`);
                }
                throw new Error(error.message || 'GraphQL error');
            }

            const paymentResult = response.data.data.confirmPayment;

            if (!paymentResult.success) {
                throw new Error(paymentResult.message || 'Failed to confirm payment');
            }

            await this.logIntegrationStatus(
                paymentData.transaction_id, 
                'PAYMENT_SERVICE', 
                'SUCCESS', 
                paymentData, 
                paymentResult
            );

            return {
                payment_id: paymentResult.payment.id,
                status: paymentResult.payment.status
            };
        } catch (error) {
            let errorMessage = error.message || 'Unknown error';
            
            if (error.response) {
                const status = error.response.status;
                const statusText = error.response.statusText;
                const responseData = error.response.data;
                
                errorMessage = `Request failed with status code ${status}${statusText ? ` (${statusText})` : ''}`;
                
                if (responseData) {
                    console.error(`Payment service response:`, JSON.stringify(responseData).substring(0, 200));
                    if (responseData.message) {
                        errorMessage += `: ${responseData.message}`;
                    }
                }
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Payment service connection refused - service may not be running';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Payment service request timeout - service may be slow or unavailable';
            }
            
            console.error(`❌ Payment service error: ${errorMessage}`);
            console.error(`Payment service URL: ${process.env.PAYMENT_SERVICE_URL}/graphql`);
            
            // Log integration failure
            await this.logIntegrationStatus(
                paymentData.transaction_id, 
                'PAYMENT_SERVICE', 
                'FAILED', 
                paymentData, 
                null, 
                errorMessage
            );
            
            // Check if error is due to authentication
            if (error.response && error.response.status === 401) {
                throw new Error('Payment service authentication failed. Please ensure you are logged in with admin role.');
            }
            
            // In production, throw error; in development, use mock ONLY if it's not an auth error
            if (process.env.NODE_ENV === 'production') {
                throw new Error(`Payment service unavailable: ${errorMessage}`);
            }
            
            // Mock untuk development only - but only if it's not an auth error
            // Auth errors should always be thrown
            if (errorMessage.includes('Authentication') || errorMessage.includes('UNAUTHENTICATED') || errorMessage.includes('FORBIDDEN')) {
                throw new Error(`Payment service authentication failed: ${errorMessage}`);
            }
            
            console.warn('⚠️  Using mock response for development (non-auth error)');
            return {
                payment_id: `PAY-${Date.now()}`,
                status: 'SUCCESS',
                processed_at: new Date()
            };
        }
    }

    /**
     * Update Inventory (deduct stock)
     */
    static async updateInventory(items) {
        try {
        const response = await axios.post(
            `${process.env.INVENTORY_SERVICE_URL}/api/update-stock`,
            { items, operation: 'DEDUCT' },
            { timeout: 5000 }
        );

        await this.logIntegrationStatus(
            null, 
            'INVENTORY_SERVICE', 
            'SUCCESS', 
            { items }, 
            response.data
        );

        return {
            updated: true,
            updated_stock: response.data.stock
        };
        } catch (error) {
        // Explicit error handling with timeout and connection error detection
        const errorMessage = error.code === 'ECONNREFUSED' 
            ? 'Inventory service connection refused - service may not be running'
            : error.code === 'ETIMEDOUT'
            ? 'Inventory service request timeout - service may be slow or unavailable'
            : error.message || 'Unknown error';
        
        console.error(`❌ Inventory service error: ${errorMessage}`);
        
        // Log integration failure
        await this.logIntegrationStatus(
            null, 
            'INVENTORY_SERVICE', 
            'FAILED', 
            { items }, 
            null, 
            errorMessage
        );
        
        // In production, throw error; in development, use mock
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Inventory service unavailable: ${errorMessage}`);
        }
        
        // Mock untuk development only
        console.warn('⚠️  Using mock response for development');
        return {
            updated: true,
            updated_stock: items.map(item => ({ 
            product_id: item.product_id, 
            new_stock: 95 - item.quantity
            }))
        };
        }
    }

    /**
     * Calculate total cost
     */
    static calculateTotalCost(items, providedTotal = null) {
        if (providedTotal) return providedTotal;
        
        return items.reduce((total, item) => {
        return total + (item.price * item.quantity);
        }, 0);
    }

    /**
     * Log to audit_logs table
     */
    static async logAudit(transactionId, action, actor, details) {
        try {
        const query = `
            INSERT INTO audit_logs (transaction_id, action, actor, details)
            VALUES ($1, $2, $3, $4)
        `;
        
        await require('../config/database').query(query, [
            transactionId,
            action,
            actor,
            JSON.stringify(details)
        ]);
        } catch (error) {
        console.error('❌ Failed to log audit:', error.message);
        }
    }

    /**
     * Log to integration_status table
     */
    static async logIntegrationStatus(
        transactionId, 
        serviceName, 
        status, 
        requestData, 
        responseData, 
        errorMessage = null
    ) {
        try {
        const query = `
            INSERT INTO integration_status 
            (transaction_id, service_name, status, request_data, response_data, error_message)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await require('../config/database').query(query, [
            transactionId,
            serviceName,
            status,
            JSON.stringify(requestData || {}),
            JSON.stringify(responseData || {}),
            errorMessage
        ]);
        } catch (error) {
        console.error('❌ Failed to log integration status:', error.message);
        }
    }
    }

module.exports = TransactionService;