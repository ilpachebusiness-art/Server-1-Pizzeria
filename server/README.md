# PizzaFlow Server

Backend API server for PizzaFlow applications (Customer, Admin, Rider).

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (customers)
- `GET /api/auth/verify` - Verify token

### Orders
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/:orderId` - Get order by ID
- `GET /api/orders/rider/:riderId` - Get orders for rider
- `GET /api/orders/customer/:customerId` - Get orders for customer
- `POST /api/orders` - Create order (Customer)
- `PATCH /api/orders/:orderId/status` - Update order status
- `PATCH /api/orders/:orderId/assign` - Assign order to rider (Admin)
- `PUT /api/orders/:orderId` - Update order (Admin)
- `DELETE /api/orders/:orderId` - Delete order (Admin)

### Menu
- `GET /api/menu/items` - Get all menu items (public)
- `GET /api/menu/items/:id` - Get menu item by ID (public)
- `GET /api/menu/items/category/:category` - Get items by category (public)
- `POST /api/menu/items` - Create menu item (Admin)
- `PUT /api/menu/items/:id` - Update menu item (Admin)
- `DELETE /api/menu/items/:id` - Delete menu item (Admin)
- `GET /api/menu/categories` - Get all categories (public)
- `POST /api/menu/categories` - Create category (Admin)

### Riders
- `GET /api/riders` - Get all riders (Admin)
- `GET /api/riders/available` - Get available riders (Admin)
- `GET /api/riders/:id` - Get rider by ID
- `POST /api/riders` - Create rider (Admin)
- `PATCH /api/riders/:id/status` - Update rider status
- `PUT /api/riders/:id` - Update rider (Admin)

### Batches
- `GET /api/batches` - Get all batches (Admin)
- `GET /api/batches/:id` - Get batch by ID
- `GET /api/batches/rider/:riderId` - Get batches for rider
- `POST /api/batches` - Create batch (Admin)
- `PUT /api/batches/:id` - Update batch (Admin)

### Admin
- `GET /api/admin/stats` - Get dashboard statistics (Admin)

### Customer
- `GET /api/customer/orders` - Get customer's orders
- `GET /api/customer/menu` - Get menu
- `POST /api/customer/orders` - Create order

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Roles

- `customer` - Can create orders and view their own orders
- `rider` - Can view assigned orders and update their status
- `admin` - Full access to all endpoints



