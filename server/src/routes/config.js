import express from 'express';
import { broadcastToCustomers } from '../websocket.js';
import { saveToFile, loadFromFile } from '../models/persistence.js';
import { auditLogStore } from '../models/auditLog.js';

const router = express.Router();

// In-memory stores for config data with file persistence
let bannersStore = [];
let locationsStore = [];
let slotCapacityStore = {
  globalMaxCapacity: 30,
  slots: []
};

// Load data on startup
async function loadConfigData() {
  const configData = await loadFromFile('config');
  if (configData) {
    bannersStore = configData.banners || [];
    slotCapacityStore = configData.slotCapacity || {
      globalMaxCapacity: 30,
      slots: []
    };
  }
  
  const locationsData = await loadFromFile('locations');
  if (locationsData) {
    locationsStore = locationsData;
  }
  
  console.log(`📦 Loaded ${bannersStore.length} banners, ${locationsStore.length} locations`);
}

// Initialize on module load
loadConfigData();

async function saveConfigData() {
  await saveToFile('config', {
    banners: bannersStore,
    slotCapacity: slotCapacityStore
  });
}

async function saveLocationsData() {
  await saveToFile('locations', locationsStore);
}

// Banners endpoints
router.get('/banners', (req, res) => {
  try {
    res.json(bannersStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/banners', async (req, res) => {
  try {
    const banner = {
      id: `BAN-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    bannersStore.push(banner);
    await saveConfigData();
    broadcastToCustomers({ type: 'banners_updated', banners: bannersStore });
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/banners/:id', async (req, res) => {
  try {
    const index = bannersStore.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    bannersStore[index] = { ...bannersStore[index], ...req.body, updatedAt: new Date().toISOString() };
    await saveConfigData();
    broadcastToCustomers({ type: 'banners_updated', banners: bannersStore });
    res.json(bannersStore[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/banners/:id', async (req, res) => {
  try {
    const index = bannersStore.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    bannersStore.splice(index, 1);
    await saveConfigData();
    broadcastToCustomers({ type: 'banners_updated', banners: bannersStore });
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Locations (Paesi e Vie) endpoints
router.get('/locations', (req, res) => {
  try {
    res.json(locationsStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/locations', async (req, res) => {
  try {
    // Se viene passato un array di locations, sostituisci tutto
    if (Array.isArray(req.body)) {
      locationsStore = req.body;
    } else if (req.body.locations && Array.isArray(req.body.locations)) {
      locationsStore = req.body.locations;
    } else {
      const location = {
        id: `LOC-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      locationsStore.push(location);
    }
    await saveLocationsData();
    broadcastToCustomers({ type: 'locations_updated', locations: locationsStore });
    res.status(201).json(locationsStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/locations/:id', async (req, res) => {
  try {
    const index = locationsStore.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Location not found' });
    }
    locationsStore[index] = { ...locationsStore[index], ...req.body, updatedAt: new Date().toISOString() };
    await saveLocationsData();
    broadcastToCustomers({ type: 'locations_updated', locations: locationsStore });
    res.json(locationsStore[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    const index = locationsStore.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Location not found' });
    }
    locationsStore.splice(index, 1);
    await saveLocationsData();
    broadcastToCustomers({ type: 'locations_updated', locations: locationsStore });
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Slot capacity endpoints
router.get('/slot-capacity', (req, res) => {
  try {
    res.json(slotCapacityStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/slot-capacity', async (req, res) => {
  try {
    slotCapacityStore = { ...slotCapacityStore, ...req.body };
    await saveConfigData();
    await auditLogStore.log('slot_capacity_updated', { 
      globalMaxCapacity: slotCapacityStore.globalMaxCapacity,
      slotsCount: slotCapacityStore.slots?.length || 0
    });
    broadcastToCustomers({ type: 'slots_updated', slots: slotCapacityStore });
    res.json(slotCapacityStore);
  } catch (error) {
    console.error('Error updating slot capacity:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

