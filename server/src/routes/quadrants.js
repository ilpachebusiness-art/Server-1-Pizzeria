import express from 'express';
import { saveToFile, loadFromFile } from '../models/persistence.js';
import { broadcastToCustomers } from '../websocket.js';
import { auditLogStore } from '../models/auditLog.js';

const router = express.Router();

// In-memory store for quadrants with file persistence
let quadrantsStore = [];

// Load data on startup
async function loadQuadrantsData() {
  const data = await loadFromFile('quadrants');
  if (data && Array.isArray(data)) {
    quadrantsStore = data;
    console.log(`📦 Loaded ${quadrantsStore.length} quadrants`);
  } else {
    quadrantsStore = [];
    console.log(`📦 Quadrants initialized with empty data`);
  }
}

// Initialize on module load
loadQuadrantsData();

async function saveQuadrantsData() {
  await saveToFile('quadrants', quadrantsStore);
}

// Get all quadrants
router.get('/', (req, res) => {
  try {
    res.json(quadrantsStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quadrant by ID
router.get('/:id', (req, res) => {
  try {
    const quadrant = quadrantsStore.find(q => q.id === parseInt(req.params.id));
    if (!quadrant) {
      return res.status(404).json({ error: 'Quadrant not found' });
    }
    res.json(quadrant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update quadrants (accepts array or single object)
router.post('/', async (req, res) => {
  try {
    // Se viene passato un array, sostituisci tutto
    if (Array.isArray(req.body)) {
      quadrantsStore = req.body;
    } else if (req.body.quadrants && Array.isArray(req.body.quadrants)) {
      quadrantsStore = req.body.quadrants;
    } else {
      // Single quadrant - create or update
      const existingIndex = quadrantsStore.findIndex(q => q.id === req.body.id);
      if (existingIndex >= 0) {
        quadrantsStore[existingIndex] = { ...quadrantsStore[existingIndex], ...req.body, updatedAt: new Date().toISOString() };
      } else {
        const quadrant = {
          ...req.body,
          id: req.body.id || Date.now(),
          createdAt: new Date().toISOString()
        };
        quadrantsStore.push(quadrant);
      }
    }
    await saveQuadrantsData();
    await auditLogStore.log('quadrants_updated', { count: quadrantsStore.length });
    broadcastToCustomers({ type: 'quadrants_updated', quadrants: quadrantsStore });
    res.status(201).json(quadrantsStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update quadrant
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = quadrantsStore.findIndex(q => q.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Quadrant not found' });
    }
    quadrantsStore[index] = { ...quadrantsStore[index], ...req.body, updatedAt: new Date().toISOString() };
    await saveQuadrantsData();
    await auditLogStore.log('quadrant_updated', { quadrantId: id, quadrantName: quadrantsStore[index].nome });
    broadcastToCustomers({ type: 'quadrants_updated', quadrants: quadrantsStore });
    res.json(quadrantsStore[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete quadrant
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = quadrantsStore.findIndex(q => q.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Quadrant not found' });
    }
    const deletedQuadrant = quadrantsStore[index];
    quadrantsStore.splice(index, 1);
    // Clean up adjacency references
    quadrantsStore = quadrantsStore.map(q => ({
      ...q,
      adiacenti: q.adiacenti ? q.adiacenti.filter(adjId => adjId !== id) : []
    }));
    await saveQuadrantsData();
    await auditLogStore.log('quadrant_deleted', { quadrantId: id, quadrantName: deletedQuadrant.nome });
    broadcastToCustomers({ type: 'quadrants_updated', quadrants: quadrantsStore });
    res.json({ message: 'Quadrant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

