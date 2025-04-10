const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'patch_management',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// Initialize database
async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        os VARCHAR(255) NOT NULL,
        last_seen TIMESTAMP,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(100) NOT NULL,
        release_date DATE NOT NULL,
        severity VARCHAR(50) NOT NULL,
        affected_systems TEXT[] NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS device_patches (
        device_id INTEGER REFERENCES devices(id),
        patch_id INTEGER REFERENCES patches(id),
        status VARCHAR(50) NOT NULL,
        installed_at TIMESTAMP,
        PRIMARY KEY (device_id, patch_id)
      );
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    const token = jwt.sign({ id: result.rows[0].id, email: result.rows[0].email }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, result.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: result.rows[0].id, email: result.rows[0].email }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device routes
app.get('/api/devices', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM devices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices', authenticateToken, async (req, res) => {
  try {
    const { name, ip_address, os } = req.body;
    const result = await pool.query(
      'INSERT INTO devices (name, ip_address, os, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, ip_address, os, 'online']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patch routes
app.get('/api/patches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patches ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patches', authenticateToken, async (req, res) => {
  try {
    const { name, version, release_date, severity, affected_systems, status } = req.body;
    const result = await pool.query(
      'INSERT INTO patches (name, version, release_date, severity, affected_systems, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, version, release_date, severity, affected_systems, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device-Patch routes
app.get('/api/device-patches/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await pool.query(
      'SELECT p.*, dp.status as installation_status, dp.installed_at FROM patches p JOIN device_patches dp ON p.id = dp.patch_id WHERE dp.device_id = $1',
      [deviceId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/device-patches', authenticateToken, async (req, res) => {
  try {
    const { device_id, patch_id, status } = req.body;
    const result = await pool.query(
      'INSERT INTO device_patches (device_id, patch_id, status, installed_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
      [device_id, patch_id, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
  // SSL Configuration
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'private.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.crt'))
  };

  // Create HTTPS server
  const server = https.createServer(sslOptions, app);

  // Start server
  const PORT = process.env.PORT || 443;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}); 