import express from 'express';
import { saveToFile, loadFromFile } from '../models/persistence.js';
import { broadcastToCustomers, broadcastToAdmins } from '../websocket.js';

const router = express.Router();

// In-memory store
let ingredientsStore = [];

// Load ingredients from file
async function loadIngredientsData() {
  try {
    const data = await loadFromFile('ingredients');
    if (data && Array.isArray(data)) {
      ingredientsStore = data;
      console.log(`📦 Loaded ${ingredientsStore.length} ingredients`);
    } else {
      ingredientsStore = [];
      console.log(`📦 Ingredients initialized with empty data`);
    }
  } catch (error) {
    console.error('Error loading ingredients:', error);
    ingredientsStore = [];
  }
}

// Save ingredients to file
async function saveIngredientsData() {
  await saveToFile('ingredients', ingredientsStore);
}

// Load on module load
loadIngredientsData();

// Get all ingredients
router.get('/', async (req, res) => {
  try {
    await loadIngredientsData();
    res.json(ingredientsStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new ingredient
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }
    
    // Check if ingredient already exists
    const existing = ingredientsStore.find(ing => ing.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Ingredient already exists' });
    }
    
    const newIngredient = {
      id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim()
    };
    
    ingredientsStore.push(newIngredient);
    await saveIngredientsData();
    
    // Broadcast update
    broadcastToCustomers({ type: 'ingredients_updated', ingredients: ingredientsStore });
    broadcastToAdmins({ type: 'ingredients_updated', ingredients: ingredientsStore });
    
    res.status(201).json(newIngredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ingredient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }
    
    const index = ingredientsStore.findIndex(ing => ing.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    // Check if name already exists (excluding current ingredient)
    const existing = ingredientsStore.find(ing => ing.id !== id && ing.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Ingredient name already exists' });
    }
    
    ingredientsStore[index] = {
      ...ingredientsStore[index],
      name: name.trim()
    };
    
    await saveIngredientsData();
    
    // Broadcast update
    broadcastToCustomers({ type: 'ingredients_updated', ingredients: ingredientsStore });
    broadcastToAdmins({ type: 'ingredients_updated', ingredients: ingredientsStore });
    
    res.json(ingredientsStore[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ingredient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = ingredientsStore.findIndex(ing => ing.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    ingredientsStore.splice(index, 1);
    await saveIngredientsData();
    
    // Broadcast update
    broadcastToCustomers({ type: 'ingredients_updated', ingredients: ingredientsStore });
    broadcastToAdmins({ type: 'ingredients_updated', ingredients: ingredientsStore });
    
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

