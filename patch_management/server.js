const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

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