import express from 'express';
import { ordersStore } from '../models/stores.js';
import { broadcastToAdmins, broadcastToRiders } from '../websocket.js';

const router = express.Router();

// NOTE: Authentication disabled for demo/dev so that the three apps can share
// orders without JWT. Re-enable authenticateToken/requireRole in production.

// Get all orders
router.get('/', (req, res) => {
  try {
    const orders = ordersStore.getAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a specific rider
router.get('/rider/:riderId', (req, res) => {
  try {
    const { riderId } = req.params;
    const orders = ordersStore.getByRiderId(riderId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a specific customer
router.get('/customer/:customerId', (req, res) => {
  try {
    const { customerId } = req.params;
    // In production, match customerId with authenticated user
    const orders = ordersStore.getByCustomerId(customerId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = ordersStore.getById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order (Customer)
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    const order = await ordersStore.create(orderData);
    
    // Notify admins of new order via WebSocket
    broadcastToAdmins({
      type: 'new_order',
      order: order
    });
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await ordersStore.updateStatus(orderId, status);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Notify admins and riders of status change
    broadcastToAdmins({
      type: 'order_updated',
      order: order
    });
    broadcastToRiders({
      type: 'order_updated',
      order: order
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign order to rider
router.patch('/:orderId/assign', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderId } = req.body;
    const order = await ordersStore.assignToRider(orderId, riderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Notify the specific rider and all admins
    broadcastToRiders({
      type: 'order_assigned',
      order: order,
      riderId: riderId
    });
    broadcastToAdmins({
      type: 'order_updated',
      order: order
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order
router.put('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderData = req.body;
    const order = await ordersStore.update(orderId, orderData);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Notify admins and riders of order update
    broadcastToAdmins({
      type: 'order_updated',
      order: order
    });
    broadcastToRiders({
      type: 'order_updated',
      order: order
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    await ordersStore.delete(orderId);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


