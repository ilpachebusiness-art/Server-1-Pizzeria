import { saveToFile, loadFromFile } from './persistence.js';

class AuditLogStore {
  constructor() {
    this.logs = [];
    this.initialized = false;
  }

  async loadData() {
    if (this.initialized) return;
    const data = await loadFromFile('audit');
    if (data && Array.isArray(data)) {
      this.logs = data;
      console.log(`📦 Loaded ${this.logs.length} audit log entries`);
    } else {
      this.logs = [];
      console.log(`📦 Audit log initialized with empty data`);
    }
    this.initialized = true;
  }

  async saveData() {
    await saveToFile('audit', this.logs);
  }

  async log(action, details, userId = 'admin', userRole = 'admin') {
    const logEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userId,
      userRole
    };
    
    this.logs.unshift(logEntry); // Aggiungi all'inizio
    
    // Mantieni solo gli ultimi 1000 log
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }
    
    await this.saveData();
    return logEntry;
  }

  getAll(limit = 100) {
    return this.logs.slice(0, limit);
  }

  getByAction(action, limit = 50) {
    return this.logs.filter(log => log.action === action).slice(0, limit);
  }

  getByUser(userId, limit = 50) {
    return this.logs.filter(log => log.userId === userId).slice(0, limit);
  }
}

export const auditLogStore = new AuditLogStore();

