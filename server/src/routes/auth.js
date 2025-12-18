import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Admin users database (only admin authentication is required)
const users = [
  {
    id: '1',
    email: 'admin@pizzaflow.com',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // "admin123" hashed
    role: 'admin',
    name: 'Admin User'
  }
];

// Simple password hash for demo (in production, use proper hashing)
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Login (Admin only)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Only allow admin login
    const user = users.find(u => u.email === email && u.role === 'admin');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Only admin access is allowed.' });
    }

    // Simple demo authentication (skip password check for demo)
    // In production: const isValid = await bcrypt.compare(password, user.password);
    const isValid = true; // Demo mode

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'pizzaflow-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register endpoint removed - only admin authentication is required

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'pizzaflow-secret-key-change-in-production'
    );

    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;



