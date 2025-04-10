const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// SSL Configuration
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.crt'))
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);

// Start server
const PORT = 443;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 