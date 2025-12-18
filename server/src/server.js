import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import ordersRouter from './routes/orders.js';
import menuRouter from './routes/menu.js';
import ridersRouter from './routes/riders.js';
import batchesRouter from './routes/batches.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import customerRouter from './routes/customer.js';
import configRouter from './routes/config.js';
import auditRouter from './routes/audit.js';
import quadrantsRouter from './routes/quadrants.js';
import dailyPerformanceRouter from './routes/dailyPerformance.js';
import ingredientsRouter from './routes/ingredients.js';

// Import WebSocket
import { initializeWebSocket, broadcastToAdmins, broadcastToRiders } from './websocket.js';
// Import persistence
import { initializeFiles, loadFromFile } from './models/persistence.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket
initializeWebSocket(server);

// Middleware
// CORS configuration - allow all origins in production, specific origins in development
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:5173', // Vite default
      'http://localhost:5174', // Customer app
      'http://localhost:5175', // Admin app
      'http://localhost:5176', // Rider app
      'http://localhost:8080'
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow all origins if ALLOWED_ORIGINS is not set
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for flexibility
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/menu', menuRouter);
app.use('/api/riders', ridersRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customer', customerRouter);
app.use('/api/config', configRouter);
app.use('/api/audit', auditRouter);
app.use('/api/quadrants', quadrantsRouter);
app.use('/api/daily-performance', dailyPerformanceRouter);
app.use('/api/ingredients', ingredientsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize persistence and start server
async function startServer() {
  try {
    console.log('🚀 Starting PizzaFlow Server...');
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Port: ${PORT}`);
    
    // Initialize data files (non bloccare se fallisce)
    try {
      await initializeFiles();
      console.log('✅ Data files initialized');
    } catch (error) {
      console.error('⚠️  Warning: Failed to initialize data files:', error.message);
      console.log('⚠️  Server will continue with in-memory storage');
    }
    
    // Load initial data for stores (non bloccare se fallisce)
    try {
      const { menuStore, ordersStore } = await import('./models/stores.js');
      const { auditLogStore } = await import('./models/auditLog.js');
      await menuStore.loadData();
      await ordersStore.loadData();
      await auditLogStore.loadData();
      console.log('✅ Stores loaded');
    } catch (error) {
      console.error('⚠️  Warning: Failed to load stores:', error.message);
      console.log('⚠️  Server will continue with empty stores');
    }
    
    // Load quadrants data on startup (non bloccare se fallisce)
    try {
      const quadrantsData = await loadFromFile('quadrants');
      if (quadrantsData && Array.isArray(quadrantsData)) {
        console.log(`📦 Loaded ${quadrantsData.length} quadrants on startup`);
      }
    } catch (error) {
      console.log('ℹ️  No quadrants data loaded (using defaults)');
    }
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('✅ ============================================');
      console.log(`🚀 PizzaFlow Server running on port ${PORT}`);
      console.log(`📡 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`🔌 WebSocket server: ws://0.0.0.0:${PORT}/ws`);
      console.log(`💾 Data persistence: server/data/`);
      console.log('✅ ============================================');
      console.log('');
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        throw error;
      }
    });
    
  } catch (error) {
    console.error('❌ Error starting server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

startServer();


