import express from 'express';
import { menuStore } from '../models/stores.js';
import { broadcastToCustomers } from '../websocket.js';
import { auditLogStore } from '../models/auditLog.js';

const router = express.Router();

// Get all menu items (public)
router.get('/items', (req, res) => {
  try {
    const items = menuStore.getAllItems();
    console.log(`📤 GET /api/menu/items - Returning ${items.length} items`);
    res.json(items);
  } catch (error) {
    console.error('❌ Error in GET /api/menu/items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get menu item by ID (public)
router.get('/items/:id', (req, res) => {
  try {
    const item = menuStore.getItemById(parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get items by category (public)
router.get('/items/category/:category', (req, res) => {
  try {
    const items = menuStore.getItemsByCategory(req.params.category);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create menu item (no auth for demo)
router.post('/items', async (req, res) => {
  try {
    const item = await menuStore.createItem(req.body);
    await auditLogStore.log('menu_item_created', { itemId: item.id, itemName: item.name });
    broadcastToCustomers({ type: 'menu_updated', items: menuStore.getAllItems() });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update menu item (no auth for demo)
router.put('/items/:id', async (req, res) => {
  try {
    const item = await menuStore.updateItem(parseInt(req.params.id), req.body);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    await auditLogStore.log('menu_item_updated', { itemId: item.id, itemName: item.name, changes: req.body });
    broadcastToCustomers({ type: 'menu_updated', items: menuStore.getAllItems() });
    res.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete menu item (no auth for demo)
router.delete('/items/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = menuStore.getItemById(itemId);
    const deleted = await menuStore.deleteItem(itemId);
    if (!deleted) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    await auditLogStore.log('menu_item_deleted', { itemId, itemName: item?.name || 'Unknown' });
    broadcastToCustomers({ type: 'menu_updated', items: menuStore.getAllItems() });
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all categories (public)
router.get('/categories', (req, res) => {
  try {
    const categories = menuStore.getAllCategories();
    console.log(`📤 GET /api/menu/categories - Returning ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error in GET /api/menu/categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create category (no auth for demo)
router.post('/categories', async (req, res) => {
  try {
    const category = await menuStore.createCategory(req.body);
    await auditLogStore.log('category_created', { categoryId: category.id, categoryName: category.name });
    broadcastToCustomers({ type: 'categories_updated', categories: menuStore.getAllCategories() });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const category = await menuStore.updateCategory(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await auditLogStore.log('category_updated', { categoryId: category.id, categoryName: category.name });
    broadcastToCustomers({ type: 'categories_updated', categories: menuStore.getAllCategories() });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = menuStore.getAllCategories().find(c => c.id === categoryId);
    const deleted = await menuStore.deleteCategory(categoryId);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await auditLogStore.log('category_deleted', { categoryId, categoryName: category?.name || 'Unknown' });
    broadcastToCustomers({ type: 'categories_updated', categories: menuStore.getAllCategories() });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;



