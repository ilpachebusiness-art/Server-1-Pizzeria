import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ordersStore, ridersStore, batchesStore, menuStore } from '../models/stores.js';

const router = express.Router();

// All admin routes require admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Dashboard stats
router.get('/stats', (req, res) => {
  try {
    const orders = ordersStore.getAll();
    const riders = ridersStore.getAll();
    const batches = batchesStore.getAll();

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      activeRiders: riders.filter(r => r.status !== 'offline').length,
      totalRiders: riders.length,
      activeBatches: batches.filter(b => b.status === 'in_progress').length,
      totalBatches: batches.length,
      revenue: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;



