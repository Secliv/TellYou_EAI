import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import orderService from '../services/orderService'
import inventoryService from '../services/inventoryService'
import './Orders.css'

function Orders() {
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)

  // Form state for creating new order
  const [newOrder, setNewOrder] = useState({
    customerId: 1,
    customerName: '',
    items: [{ ingredientId: '', name: '', quantity: 1, price: 0, unit: 'kg' }],
    notes: '',
    shippingAddress: ''
  })

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders()
  }, [filterStatus])

  // Fetch ingredients when modal opens (for users)
  useEffect(() => {
    if (showCreateModal && !isAdmin()) {
      fetchIngredients()
    }
  }, [showCreateModal])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const filters = filterStatus ? { status: filterStatus } : {}
      
      // For users, only fetch their own orders
      if (!isAdmin()) {
        filters.customerId = user?.id
      }
      
      const result = await orderService.getAllOrders(filters)
      if (result.success) {
        let orderList = result.orders || []
        // For users, filter by customerName (if customerId filter not supported by backend)
        if (!isAdmin() && user?.username) {
          orderList = orderList.filter(o => 
            o.customerName?.toLowerCase() === user.username?.toLowerCase() ||
            o.customerId === user.id
          )
        }
        setOrders(orderList)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    try {
      setLoadingIngredients(true)
      const result = await inventoryService.getAll({})
      console.log('Inventory result:', result) // Debug log
      if (result.success) {
        // Ensure all items have proper price as number
        const items = (result.items || []).map(item => ({
          ...item,
          id: item.id,
          price: parseFloat(item.price) || 0,
          quantity: parseFloat(item.quantity) || 0
        }))
        console.log('Processed ingredients:', items) // Debug log
        setIngredients(items)
      }
    } catch (err) {
      console.error('Failed to fetch ingredients:', err)
      toast.error('Gagal memuat daftar bahan. Pastikan Inventory Service berjalan.')
    } finally {
      setLoadingIngredients(false)
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    try {
      // Validate items have price
      const validItems = newOrder.items.filter(item => item.name && item.quantity > 0)
      if (validItems.length === 0) {
        toast.error('Pilih minimal satu bahan untuk dipesan')
        return
      }

      // Validate stock availability for all items
      const stockErrors = []
      for (const item of validItems) {
        const ingredient = ingredients.find(i => 
          String(i.id) === String(item.ingredientId) || i.id === parseInt(item.ingredientId)
        )
        if (ingredient && item.quantity > ingredient.quantity) {
          stockErrors.push(`${item.name}: jumlah ${item.quantity} ${item.unit} melebihi stok tersedia ${ingredient.quantity} ${ingredient.unit}`)
        }
      }

      if (stockErrors.length > 0) {
        toast.error(`Stok tidak mencukupi:\n${stockErrors.join('\n')}`)
        return
      }

      // Ensure all items have proper price
      const itemsWithPrice = validItems.map(item => ({
        ingredientId: parseInt(item.ingredientId) || 0,
        name: item.name,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        unit: item.unit || 'kg'
      }))

      console.log('Items to submit:', itemsWithPrice) // Debug log

      const orderData = {
        customerId: user?.id || newOrder.customerId,
        customerName: user?.username || newOrder.customerName,
        items: itemsWithPrice,
        notes: newOrder.notes,
        shippingAddress: newOrder.shippingAddress
      }
      
      console.log('Order data:', orderData) // Debug log
      
      const result = await orderService.createOrder(orderData)
      if (result.success) {
        toast.success('Pesanan berhasil dibuat!')
        setShowCreateModal(false)
        setNewOrder({
          customerId: 1,
          customerName: '',
          items: [{ ingredientId: '', name: '', quantity: 1, price: 0, unit: 'kg' }],
          notes: '',
          shippingAddress: ''
        })
        fetchOrders()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error(err.message || 'Gagal membuat pesanan')
    }
  }

  const handleUpdateStatus = async (order, newStatus) => {
    try {
      const result = await orderService.updateOrderStatus(order.id, newStatus)
      if (result.success) {
        toast.success(`Status pesanan #${order.id} diubah menjadi ${getStatusLabel(newStatus)}`)
        fetchOrders()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error(err.message || 'Gagal update status')
    }
  }

  const handleCancelOrder = async (order) => {
    if (confirm(`Apakah Anda yakin ingin membatalkan pesanan #${order.id}?`)) {
      try {
        const result = await orderService.cancelOrder(order.id)
        if (result.success) {
          toast.success(`Pesanan #${order.id} berhasil dibatalkan`)
          fetchOrders()
        } else {
          toast.error(result.message)
        }
      } catch (err) {
        toast.error(err.message || 'Gagal membatalkan pesanan')
      }
    }
  }

  const addItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { ingredientId: '', name: '', quantity: 1, price: 0, unit: 'kg' }]
    })
  }

  const removeItem = (index) => {
    const items = newOrder.items.filter((_, i) => i !== index)
    setNewOrder({ ...newOrder, items })
  }

  const updateItem = (index, field, value) => {
    const items = [...newOrder.items]
    
    // If selecting from ingredient dropdown
    if (field === 'ingredientId' && value) {
      // Find ingredient - compare both as string and number
      const selected = ingredients.find(i => 
        String(i.id) === String(value) || i.id === parseInt(value)
      )
      
      console.log('Selected ingredient:', selected) // Debug log
      
      if (selected) {
        items[index] = {
          ...items[index],
          ingredientId: parseInt(selected.id) || selected.id,
          name: selected.name,
          price: parseFloat(selected.price) || 0,
          unit: selected.unit || 'kg'
        }
        console.log('Updated item:', items[index]) // Debug log
        setNewOrder({ ...newOrder, items })
        return
      }
    }

    if (field === 'quantity') {
      const qty = parseInt(value) || 1
      // Find the selected ingredient to check stock
      const selectedIngredient = ingredients.find(i => 
        String(i.id) === String(items[index].ingredientId) || i.id === parseInt(items[index].ingredientId)
      )
      
      // Validate quantity doesn't exceed stock
      if (selectedIngredient && qty > selectedIngredient.quantity) {
        toast.error(`Jumlah melebihi stok tersedia. Stok tersedia: ${selectedIngredient.quantity} ${selectedIngredient.unit}`)
        // Set to max available stock
        items[index] = { ...items[index], quantity: selectedIngredient.quantity }
      } else {
        items[index] = { ...items[index], quantity: qty }
      }
    } else if (field === 'price') {
      items[index] = { ...items[index], price: parseFloat(value) || 0 }
    } else {
      items[index] = { ...items[index], [field]: value }
    }
    setNewOrder({ ...newOrder, items })
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      processing: '#9b59b6',
      shipped: '#1abc9c',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    }
    return colors[status] || '#666'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Menunggu',
      confirmed: 'Dikonfirmasi',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Diterima',
      cancelled: 'Dibatalkan'
    }
    return labels[status] || status
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    
    try {
      let date
      if (!isNaN(dateString)) {
        date = new Date(parseInt(dateString))
      } else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        return '-'
      }
      
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }) + ' WIB'
    } catch (error) {
      return '-'
    }
  }

  if (loading) {
    return (
      <div className="orders">
        <div className="loading">Memuat pesanan...</div>
      </div>
    )
  }

  return (
    <div className="orders">
      <div className="orders-header">
        <h1>{isAdmin() ? '📦 Kelola Pesanan' : '🛒 Pesanan Saya'}</h1>
        {/* Only users can create orders */}
        {!isAdmin() && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Buat Pesanan Baru
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filter */}
      <div className="filters">
        <label>Filter Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="confirmed">Dikonfirmasi</option>
          <option value="processing">Diproses</option>
          <option value="shipped">Dikirim</option>
          <option value="delivered">Diterima</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="orders-grid">
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>{isAdmin() ? 'Belum ada pesanan' : 'Anda belum memiliki pesanan'}</p>
            {!isAdmin() && (
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                Buat Pesanan Pertama
              </button>
            )}
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">#{order.id}</span>
                <span 
                  className="order-status" 
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="order-customer">
                <strong>{order.customerName || 'Customer'}</strong>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                <ul>
                  {order.items?.map((item, idx) => (
                    <li key={idx}>
                      {item.name} - {item.quantity} {item.unit} x {formatPrice(item.price)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-total">
                <strong>Total: {formatPrice(order.totalPrice)}</strong>
              </div>

              {order.shippingAddress && (
                <div className="order-address">
                  <small>📍 {order.shippingAddress}</small>
                </div>
              )}

              <div className="order-date">
                <small>{formatDate(order.createdAt)}</small>
              </div>

              <div className="order-actions">
                {/* Admin actions - manage order status */}
                {isAdmin() && (
                  <>
                    {order.status === 'pending' && (
                      <>
                        <button 
                          className="btn-confirm"
                          onClick={() => handleUpdateStatus(order, 'confirmed')}
                        >
                          Konfirmasi
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={() => handleCancelOrder(order)}
                        >
                          Tolak
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button 
                        className="btn-process"
                        onClick={() => handleUpdateStatus(order, 'processing')}
                      >
                        Proses
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button 
                        className="btn-ship"
                        onClick={() => handleUpdateStatus(order, 'shipped')}
                      >
                        Kirim
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button 
                        className="btn-deliver"
                        onClick={() => handleUpdateStatus(order, 'delivered')}
                      >
                        Selesai
                      </button>
                    )}
                  </>
                )}
                
                {/* User actions - only cancel pending orders */}
                {!isAdmin() && order.status === 'pending' && (
                  <button 
                    className="btn-cancel"
                    onClick={() => handleCancelOrder(order)}
                  >
                    Batalkan
                  </button>
                )}

                <button 
                  className="btn-detail"
                  onClick={() => setSelectedOrder(order)}
                >
                  Detail
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Order Modal - Only for Users */}
      {showCreateModal && !isAdmin() && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>🛒 Buat Pesanan Baru</h2>
            
            {/* Available Ingredients Preview */}
            <div className="ingredients-preview">
              <h4>📦 Bahan Tersedia</h4>
              {loadingIngredients ? (
                <p>Memuat bahan...</p>
              ) : (
                <div className="ingredients-cards">
                  {ingredients.slice(0, 6).map(ing => (
                    <div key={ing.id} className="ingredient-mini-card">
                      <span className="ing-name">{ing.name}</span>
                      <span className="ing-price">{formatPrice(ing.price)}/{ing.unit}</span>
                      <span className={`ing-stock ${ing.quantity <= ing.minStock ? 'low' : ''}`}>
                        Stok: {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label>Alamat Pengiriman</label>
                <textarea
                  value={newOrder.shippingAddress}
                  onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                  required
                />
              </div>

              <div className="form-group">
                <label>Items Pesanan</label>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <select
                      value={item.ingredientId || ''}
                      onChange={(e) => updateItem(index, 'ingredientId', e.target.value)}
                      required
                      className="ingredient-select"
                    >
                      <option value="">-- Pilih Bahan --</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} - {formatPrice(ing.price)}/{ing.unit} (Stok: {ing.quantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      min="1"
                      required
                      className="qty-input"
                    />
                    <span className="unit-label">{item.unit}</span>
                    <span className="price-label">{formatPrice(item.price)}</span>
                    {newOrder.items.length > 1 && (
                      <button type="button" className="btn-remove" onClick={() => removeItem(index)}>×</button>
                    )}
                    <span className="item-subtotal">
                      = {formatPrice((item.quantity || 0) * (item.price || 0))}
                    </span>
                  </div>
                ))}
                <button type="button" className="btn-add-item" onClick={addItem}>+ Tambah Item</button>
                
                <div className="total-preview">
                  <strong>Total Estimasi: {formatPrice(newOrder.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0))}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Catatan (opsional)</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Catatan tambahan untuk pesanan"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Buat Pesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Detail Pesanan #{selectedOrder.id}</h2>
            <div className="order-detail">
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Status:</strong> 
                <span style={{ color: getStatusColor(selectedOrder.status), marginLeft: '8px' }}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </p>
              <p><strong>Alamat:</strong> {selectedOrder.shippingAddress || '-'}</p>
              <p><strong>Catatan:</strong> {selectedOrder.notes || '-'}</p>
              
              <h4>Items:</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{formatPrice(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Total</strong></td>
                    <td><strong>{formatPrice(selectedOrder.totalPrice)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              <p><strong>Dibuat:</strong> {formatDate(selectedOrder.createdAt)}</p>
              <p><strong>Diupdate:</strong> {formatDate(selectedOrder.updatedAt)}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
