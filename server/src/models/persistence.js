import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directory per i file di persistenza
const DATA_DIR = join(__dirname, '../../data');

// Assicurati che la directory esista
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
    console.log(`📁 Data directory exists: ${DATA_DIR}`);
  } catch (error) {
    console.log(`📁 Creating data directory: ${DATA_DIR}`);
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      console.log(`✅ Created data directory: ${DATA_DIR}`);
    } catch (mkdirError) {
      console.error(`❌ Failed to create data directory: ${mkdirError.message}`);
      // Non bloccare l'avvio se non riesce a creare la directory
      // Su Railway potrebbe essere un problema di permessi, ma il server può funzionare
      throw mkdirError;
    }
  }
}

// File paths
const FILES = {
  menu: join(DATA_DIR, 'menu.json'),
  config: join(DATA_DIR, 'config.json'),
  locations: join(DATA_DIR, 'locations.json'),
  riders: join(DATA_DIR, 'riders.json'),
  audit: join(DATA_DIR, 'audit.json'),
  quadrants: join(DATA_DIR, 'quadrants.json'),
  orders: join(DATA_DIR, 'orders.json'),
  ingredients: join(DATA_DIR, 'ingredients.json'),
  dailyPerformance: join(DATA_DIR, 'dailyPerformance.json')
};

// Salva dati in un file
export async function saveToFile(key, data) {
  try {
    await ensureDataDir();
    const filePath = FILES[key];
    if (!filePath) {
      console.error(`❌ Unknown file key: ${key}`);
      return false;
    }
    console.log(`💾 Attempting to save ${key} to: ${filePath}`);
    // Verifica che la directory esista prima di salvare
    const lastSlash = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
    const dirPath = lastSlash > 0 ? filePath.substring(0, lastSlash) : DATA_DIR;
    try {
      await fs.access(dirPath);
      console.log(`📁 Directory exists: ${dirPath}`);
    } catch {
      console.log(`📁 Creating directory: ${dirPath}`);
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dirPath}`);
    }
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
    console.log(`✅ Saved ${key} to ${filePath} (${jsonData.length} bytes)`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${key}:`, error);
    console.error(`   File path: ${FILES[key]}`);
    console.error(`   Error details:`, error.message);
    return false;
  }
}

// Carica dati da un file
export async function loadFromFile(key) {
  try {
    await ensureDataDir();
    const filePath = FILES[key];
    if (!filePath) {
      console.error(`Unknown file key: ${key}`);
      return null;
    }
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`✅ Loaded ${key} from ${filePath}`);
      return parsed;
    } catch (error) {
      // File non esiste ancora, restituisci null (non è un errore)
      if (error.code === 'ENOENT') {
        console.log(`ℹ️  File ${filePath} does not exist yet, using defaults`);
      } else {
        console.error(`⚠️  Error reading ${key}:`, error.message);
      }
      return null;
    }
  } catch (error) {
    // Se non riesce a creare la directory, restituisci null invece di crashare
    console.error(`⚠️  Error loading ${key}:`, error.message);
    return null;
  }
}

// Inizializza i file se non esistono
export async function initializeFiles() {
  try {
    await ensureDataDir();
  } catch (error) {
    console.error(`❌ Cannot create data directory: ${error.message}`);
    throw error;
  }
  
  // Inizializza menu.json se non esiste
  try {
    await fs.access(FILES.menu);
    console.log(`✅ menu.json already exists`);
  } catch {
    console.log(`ℹ️  Creating menu.json...`);
    const saved = await saveToFile('menu', { items: [], categories: [] });
    if (saved) {
      console.log(`✅ Created menu.json`);
    } else {
      console.error(`⚠️  Failed to create menu.json (continuing anyway)`);
    }
  }
  
  // Inizializza config.json se non esiste
  try {
    await fs.access(FILES.config);
  } catch {
    await saveToFile('config', {
      banners: [],
      slotCapacity: {
        globalMaxCapacity: 30,
        slots: []
      }
    });
  }
  
  // Inizializza locations.json se non esiste
  try {
    await fs.access(FILES.locations);
  } catch {
    await saveToFile('locations', []);
  }
  
  // Inizializza riders.json se non esiste
  try {
    await fs.access(FILES.riders);
  } catch {
    await saveToFile('riders', []);
  }
  
  // Inizializza audit.json se non esiste
  try {
    await fs.access(FILES.audit);
  } catch {
    await saveToFile('audit', []);
  }
  
  // Inizializza quadrants.json se non esiste
  try {
    await fs.access(FILES.quadrants);
  } catch {
    await saveToFile('quadrants', []);
  }
  
  // Inizializza orders.json se non esiste
  try {
    await fs.access(FILES.orders);
  } catch {
    await saveToFile('orders', []);
  }
  
  // Inizializza dailyPerformance.json se non esiste
  try {
    await fs.access(FILES.dailyPerformance);
  } catch {
    await saveToFile('dailyPerformance', []);
  }
  
  // Inizializza ingredients.json se non esiste
  try {
    await fs.access(FILES.ingredients);
  } catch {
    await saveToFile('ingredients', []);
  }
}

