import { v4 as uuidv4 } from 'uuid';
import { saveToFile, loadFromFile } from './persistence.js';

// In-memory data stores with file persistence

// Orders Store
class OrdersStore {
  constructor() {
    this.orders = [];
  }

  async loadData() {
    const data = await loadFromFile('orders');
    if (data && Array.isArray(data)) {
      this.orders = data;
      console.log(`📦 Loaded ${this.orders.length} orders`);
    } else {
      this.orders = [];
      console.log(`📦 Orders initialized with empty data`);
    }
  }

  async saveData() {
    await saveToFile('orders', this.orders);
  }

  getAll() {
    return this.orders;
  }

  getById(id) {
    return this.orders.find(o => o.id === id);
  }

  getByRiderId(riderId) {
    return this.orders.filter(o => o.riderId === riderId);
  }

  getByCustomerId(customerId) {
    return this.orders.filter(o => o.customer.id === customerId || o.customer.email === customerId);
  }

  async create(orderData) {
    const order = {
      id: uuidv4(),
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.orders.push(order);
    await this.saveData();
    return order;
  }

  async update(id, updates) {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveData();
    return this.orders[index];
  }

  async updateStatus(id, status) {
    return await this.update(id, { status });
  }

  async assignToRider(id, riderId) {
    return await this.update(id, { riderId });
  }

  async delete(id) {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return false;
    this.orders.splice(index, 1);
    await this.saveData();
    return true;
  }
}

// Menu Store
class MenuStore {
  constructor() {
    this.items = [];
    this.categories = [];
    this.initialized = false;
  }

  async loadData() {
    if (this.initialized) {
      console.log('📦 Menu store already initialized, skipping load');
      return;
    }
    try {
      const data = await loadFromFile('menu');
      if (data) {
        // Normalizza gli ingredienti quando si caricano i dati
        this.items = Array.isArray(data.items) ? data.items.map(item => ({
          ...item,
          ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(ing => {
            // Se è una stringa, prova a parsarla, altrimenti usa l'oggetto
            if (typeof ing === 'string') {
              // Se è una stringa PowerShell, prova a estrarre i dati
              const idMatch = ing.match(/id=([^;]+)/);
              const nameMatch = ing.match(/name=([^}]+)/);
              if (idMatch && nameMatch) {
                return { id: idMatch[1].trim(), name: nameMatch[1].trim() };
              }
              return null;
            }
            return ing && typeof ing === 'object' ? { id: ing.id || '', name: ing.name || '' } : null;
          }).filter(Boolean) : []
        })) : [];
        this.categories = Array.isArray(data.categories) ? data.categories : [];
        console.log(`📦 Loaded ${this.items.length} menu items and ${this.categories.length} categories from menu.json`);
      } else {
        // Se non ci sono dati, inizializza con array vuoti
        this.items = [];
        this.categories = [];
        console.log(`📦 Menu store initialized with empty data (no menu.json file found)`);
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error loading menu data:', error);
      this.items = [];
      this.categories = [];
      this.initialized = true;
    }
  }

  async saveData() {
    // Normalizza gli ingredienti per ogni item prima di salvare
    const normalizedItems = (Array.isArray(this.items) ? this.items : []).map(item => ({
      ...item,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(ing => 
        typeof ing === 'string' ? ing : (ing && typeof ing === 'object' ? { id: ing.id || '', name: ing.name || '' } : null)
      ).filter(Boolean) : []
    }));
    
    const dataToSave = {
      items: normalizedItems,
      categories: Array.isArray(this.categories) ? this.categories : []
    };
    const saved = await saveToFile('menu', dataToSave);
    if (saved) {
      console.log(`💾 Saved menu: ${dataToSave.items.length} items, ${dataToSave.categories.length} categories`);
    } else {
      console.error('❌ Failed to save menu data');
    }
    return saved;
  }

  getAllItems() {
    return this.items;
  }

  getItemById(id) {
    return this.items.find(item => item.id === id);
  }

  getItemsByCategory(category) {
    return this.items.filter(item => item.category === category);
  }

  async createItem(itemData) {
    // Genera un ID univoco basato sul timestamp se non fornito
    const maxId = this.items.length > 0 ? Math.max(...this.items.map(i => i.id || 0)) : 0;
    const item = {
      id: itemData.id || (maxId + 1),
      ...itemData,
      createdAt: new Date().toISOString()
    };
    this.items.push(item);
    console.log(`💾 Saving menu item: ${item.name} (ID: ${item.id})`);
    const saved = await this.saveData();
    if (saved) {
      console.log(`✅ Created and saved menu item: ${item.name} (ID: ${item.id})`);
    } else {
      console.error(`❌ Failed to save menu item: ${item.name} (ID: ${item.id})`);
    }
    return item;
  }

  async updateItem(id, updates) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    // Normalizza gli ingredienti se presenti
    const normalizedUpdates = { ...updates };
    if (updates.ingredients !== undefined) {
      normalizedUpdates.ingredients = Array.isArray(updates.ingredients) 
        ? updates.ingredients.filter(ing => ing && ing.id && ing.name)
        : [];
    }
    
    this.items[index] = { 
      ...this.items[index], 
      ...normalizedUpdates, 
      updatedAt: new Date().toISOString() 
    };
    
    console.log(`💾 Updating menu item ${id} with ingredients:`, {
      ingredientsCount: normalizedUpdates.ingredients?.length || 0,
      ingredients: normalizedUpdates.ingredients
    });
    
    await this.saveData();
    return this.items[index];
  }

  async deleteItem(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    await this.saveData();
    return true;
  }

  getAllCategories() {
    return this.categories;
  }

  async createCategory(categoryData) {
    const category = {
      id: uuidv4(),
      ...categoryData,
      createdAt: new Date().toISOString()
    };
    this.categories.push(category);
    console.log(`💾 Saving category: ${category.name} (ID: ${category.id})`);
    const saved = await this.saveData();
    if (saved) {
      console.log(`✅ Created and saved category: ${category.name} (ID: ${category.id})`);
    } else {
      console.error(`❌ Failed to save category: ${category.name} (ID: ${category.id})`);
    }
    return category;
  }

  async updateCategory(id, updates) {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return null;
    this.categories[index] = { ...this.categories[index], ...updates, updatedAt: new Date().toISOString() };
    await this.saveData();
    return this.categories[index];
  }

  async deleteCategory(id) {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return false;
    this.categories.splice(index, 1);
    await this.saveData();
    return true;
  }
}

// Riders Store
class RidersStore {
  constructor() {
    this.riders = [];
  }

  getAll() {
    return this.riders;
  }

  getById(id) {
    return this.riders.find(r => r.id === id);
  }

  getAvailable() {
    return this.riders.filter(r => r.status === 'available');
  }

  create(riderData) {
    const rider = {
      id: uuidv4(),
      ...riderData,
      status: riderData.status || 'offline',
      currentCapacity: 0,
      createdAt: new Date().toISOString()
    };
    this.riders.push(rider);
    return rider;
  }

  update(id, updates) {
    const index = this.riders.findIndex(r => r.id === id);
    if (index === -1) return null;
    this.riders[index] = { ...this.riders[index], ...updates };
    return this.riders[index];
  }

  updateStatus(id, status) {
    return this.update(id, { status });
  }
}

// Batches Store
class BatchesStore {
  constructor() {
    this.batches = [];
  }

  getAll() {
    return this.batches;
  }

  getById(id) {
    return this.batches.find(b => b.id === id);
  }

  getByRiderId(riderId) {
    return this.batches.filter(b => b.fattorino_id === riderId);
  }

  create(batchData) {
    const batch = {
      id: uuidv4(),
      ...batchData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.batches.push(batch);
    return batch;
  }

  update(id, updates) {
    const index = this.batches.findIndex(b => b.id === id);
    if (index === -1) return null;
    this.batches[index] = { ...this.batches[index], ...updates };
    return this.batches[index];
  }

  delete(id) {
    const index = this.batches.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.batches.splice(index, 1);
    return true;
  }
}

export const ordersStore = new OrdersStore();
export const menuStore = new MenuStore();
export const ridersStore = new RidersStore();
export const batchesStore = new BatchesStore();



