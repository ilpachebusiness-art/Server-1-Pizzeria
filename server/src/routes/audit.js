import express from 'express';
import { auditLogStore } from '../models/auditLog.js';

const router = express.Router();

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = auditLogStore.getAll(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs by action
router.get('/action/:action', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = auditLogStore.getByAction(req.params.action, limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs by user
router.get('/user/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = auditLogStore.getByUser(req.params.userId, limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

