import express from 'express';
import { saveToFile, loadFromFile } from '../models/persistence.js';

const router = express.Router();

// Get all daily performance records
router.get('/', async (req, res) => {
  try {
    const data = await loadFromFile('dailyPerformance');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save or update daily performance
router.post('/', async (req, res) => {
  try {
    const performance = req.body;
    const data = await loadFromFile('dailyPerformance') || [];
    
    // Check if performance for this date already exists
    const existingIndex = data.findIndex((p) => p.date === performance.date);
    
    if (existingIndex >= 0) {
      // Update existing
      data[existingIndex] = performance;
    } else {
      // Add new
      data.push(performance);
    }
    
    // Sort by date (newest first)
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    await saveToFile('dailyPerformance', data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete daily performance
router.delete('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const data = await loadFromFile('dailyPerformance') || [];
    
    const filtered = data.filter((p) => p.date !== date);
    
    await saveToFile('dailyPerformance', filtered);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

