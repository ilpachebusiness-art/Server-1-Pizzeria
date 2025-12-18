import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ridersStore } from '../models/stores.js';
import { auditLogStore } from '../models/auditLog.js';
import { broadcastToAdmins, broadcastToRiders } from '../websocket.js';

const router = express.Router();

// Get all riders (no auth for demo)
router.get('/', (req, res) => {
  try {
    const riders = ridersStore.getAll();
    res.json(riders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available riders (Admin only)
router.get('/available', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const riders = ridersStore.getAvailable();
    res.json(riders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rider by ID (no auth for demo)
router.get('/:id', (req, res) => {
  try {
    const rider = ridersStore.getById(req.params.id);
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    res.json(rider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create rider (no auth for demo - allows riders to create themselves)
router.post('/', (req, res) => {
  try {
    const rider = ridersStore.create(req.body);
    res.status(201).json(rider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rider status (Rider/Admin) - no auth for demo
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const rider = ridersStore.updateStatus(id, status);
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    await auditLogStore.log('rider_status_updated', { 
      riderId: id, 
      riderName: rider.name, 
      newStatus: status 
    });
    
    // Broadcast status update to admins and riders
    broadcastToAdmins({ 
      type: 'rider_status_updated', 
      riderId: id,
      rider: rider,
      newStatus: status 
    });
    broadcastToRiders({ 
      type: 'rider_status_updated', 
      riderId: id,
      rider: rider,
      newStatus: status 
    });
    
    res.json(rider);
  } catch (error) {
    console.error('Error updating rider status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update rider (Admin only) - no auth for demo
router.put('/:id', async (req, res) => {
  try {
    const rider = ridersStore.update(req.params.id, req.body);
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    await auditLogStore.log('rider_updated', { 
      riderId: rider.id, 
      riderName: rider.name, 
      changes: req.body 
    });
    
    res.json(rider);
  } catch (error) {
    console.error('Error updating rider:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;



