import express from 'express';
import { batchesStore } from '../models/stores.js';
import { broadcastToRiders, broadcastToAdmins } from '../websocket.js';

const router = express.Router();

// Get all batches (no auth for demo)
router.get('/', (req, res) => {
  try {
    const batches = batchesStore.getAll();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get batch by ID (no auth for demo)
router.get('/:id', (req, res) => {
  try {
    const batch = batchesStore.getById(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get batches by rider ID (no auth for demo)
router.get('/rider/:riderId', (req, res) => {
  try {
    const batches = batchesStore.getByRiderId(req.params.riderId);
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create batch (no auth for demo)
router.post('/', (req, res) => {
  try {
    const batch = batchesStore.create(req.body);
    
    // Notify riders if batch is assigned
    if (batch.fattorino_id) {
      broadcastToRiders({
        type: 'batch_assigned',
        batch: batch
      });
    }
    broadcastToAdmins({
      type: 'batch_created',
      batch: batch
    });
    
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update batch (no auth for demo)
router.put('/:id', (req, res) => {
  try {
    const batch = batchesStore.update(req.params.id, req.body);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // Notify riders if batch is assigned or updated
    if (batch.fattorino_id) {
      broadcastToRiders({
        type: 'batch_updated',
        batch: batch
      });
    }
    broadcastToAdmins({
      type: 'batch_updated',
      batch: batch
    });
    
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete batch (no auth for demo)
router.delete('/:id', (req, res) => {
  try {
    const batch = batchesStore.getById(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    batchesStore.delete(req.params.id);
    
    // Notify admins and riders
    broadcastToAdmins({
      type: 'batch_deleted',
      batchId: req.params.id
    });
    if (batch.fattorino_id) {
      broadcastToRiders({
        type: 'batch_deleted',
        batchId: req.params.id
      });
    }
    
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


