const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create build directory
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Build client
console.log('Building client...');
execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

// Copy server files
console.log('Copying server files...');
const serverFiles = [
  'server.js',
  'package.json',
  '.env',
  'README.md'
];

serverFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(buildDir, file));
  }
});

// Create SSL directory
const sslDir = path.join(buildDir, 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir);
}

// Copy client build
console.log('Copying client build...');
fs.cpSync('client/build', path.join(buildDir, 'client'), { recursive: true });

// Create installation script
console.log('Creating installation script...');
const installScript = `#!/bin/bash
# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install MongoDB if not present
if ! command -v mongod &> /dev/null; then
    echo "Installing MongoDB..."
    sudo apt-get install -y mongodb
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate SSL certificates if not present
if [ ! -f "ssl/private.key" ] || [ ! -f "ssl/certificate.crt" ]; then
    echo "Generating SSL certificates..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes -subj "/CN=localhost"
fi

# Start the application
echo "Starting the application..."
npm start
`;

fs.writeFileSync(path.join(buildDir, 'install.sh'), installScript);
fs.chmodSync(path.join(buildDir, 'install.sh'), '755');

console.log('Build completed successfully!'); 