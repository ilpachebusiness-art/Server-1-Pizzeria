import express from 'express';
import { ordersStore, menuStore } from '../models/stores.js';
import { broadcastToAdmins } from '../websocket.js';

const router = express.Router();

// Get customer's orders (no auth - removed authentication requirement)
router.get('/orders', (req, res) => {
  try {
    // Get orders by customerId from query params
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId query parameter required' });
    }
    const orders = ordersStore.getByCustomerId(customerId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get menu (public, but authenticated users get personalized recommendations)
router.get('/menu', (req, res) => {
  try {
    const items = menuStore.getAllItems();
    const categories = menuStore.getAllCategories();
    res.json({ items, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order (no auth for demo)
router.post('/orders', (req, res) => {
  try {
    const orderData = req.body;
    const order = ordersStore.create(orderData);
    
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

export default router;


