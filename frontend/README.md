# TELLYOU EAI Frontend

Frontend application untuk TELLYOU EAI Inventory Management System.

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build tool dan dev server
- **React Router** - Routing
- **Axios** - HTTP client
- **Context API** - State management

## Features

- ✅ User Authentication (Login/Register)
- ✅ Dashboard
- ✅ Inventory Management (UI ready, backend integration pending)
- ✅ Orders Management (Coming soon)
- ✅ Responsive Design

## Setup

### Prerequisites

- Node.js 18+ 
- npm atau yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Frontend akan berjalan di http://localhost:5173

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Buat file `.env` di folder `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_INVENTORY_API_URL=http://localhost:3001
VITE_PAYMENT_API_URL=http://localhost:3002
VITE_ORDER_API_URL=http://localhost:3003
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.jsx
│   │   └── PrivateRoute.jsx
│   ├── contexts/         # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Inventory.jsx
│   │   └── Orders.jsx
│   ├── services/        # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── userService.js
│   │   └── inventoryService.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## API Integration

Frontend terhubung dengan microservices berikut:

- **User Service** (port 3000) - Authentication & User Management
- **Inventory Service** (port 3001) - Inventory Management
- **Payment Service** (port 3002) - Payment Processing
- **Order Service** (port 3003) - Order Management

## Authentication Flow

1. User register/login melalui `/login` atau `/register`
2. Token JWT disimpan di localStorage
3. Token digunakan untuk authenticated requests
4. Protected routes menggunakan `PrivateRoute` component

## Development Notes

- Frontend menggunakan proxy di Vite untuk development
- API calls menggunakan Axios dengan interceptors untuk token management
- Error handling untuk 401 (unauthorized) akan redirect ke login


