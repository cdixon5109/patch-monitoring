#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root"
  exit 1
fi

# Update system
echo "Updating system packages..."
dnf update -y

# Install required dependencies
echo "Installing required dependencies..."
dnf install -y epel-release
dnf install -y openssl tar gzip firewalld

# Start and enable firewalld
echo "Starting firewalld..."
systemctl enable firewalld
systemctl start firewalld

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
dnf install -y nodejs

# Install PostgreSQL
echo "Installing PostgreSQL..."
dnf install -y postgresql-server postgresql-contrib

# Fix PostgreSQL directory permissions
echo "Setting up PostgreSQL permissions..."
chown -R postgres:postgres /var/lib/pgsql
chmod 700 /var/lib/pgsql

# Initialize PostgreSQL only if not already initialized
echo "Checking PostgreSQL initialization..."
if [ ! -d "/var/lib/pgsql/data" ] || [ -z "$(ls -A /var/lib/pgsql/data)" ]; then
    echo "Initializing PostgreSQL..."
    postgresql-setup --initdb
else
    echo "PostgreSQL already initialized, skipping..."
fi

# Ensure PostgreSQL is running
systemctl enable postgresql
systemctl start postgresql

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
# Create database if it doesn't exist
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='patch_management'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE patch_management;"
# Set password if not already set
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
# Create extension if not exists
sudo -u postgres psql -d patch_management -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Create application directory
echo "Setting up application directory..."
APP_DIR="/opt/patch-management"
mkdir -p $APP_DIR
chown -R $SUDO_USER:$SUDO_USER $APP_DIR

# Copy application files
echo "Copying application files..."
if [ -f "patch-management.tar.gz" ]; then
    echo "Extracting application package..."
    tar -xzf patch-management.tar.gz -C $APP_DIR
    chown -R $SUDO_USER:$SUDO_USER $APP_DIR
else
    echo "No application package found. Please ensure patch-management.tar.gz exists in the current directory."
    exit 1
fi

# Install application dependencies
echo "Installing application dependencies..."
cd $APP_DIR
if [ -f "package.json" ]; then
    npm install
else
    echo "package.json not found in $APP_DIR. Please ensure the application package is complete."
    exit 1
fi

# Generate SSL certificates
echo "Generating SSL certificates..."
mkdir -p $APP_DIR/ssl
chown -R $SUDO_USER:$SUDO_USER $APP_DIR/ssl
cd $APP_DIR/ssl
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 365 -nodes -subj "/CN=localhost"
chmod 600 private.key certificate.crt

# Configure firewall
echo "Configuring firewall..."
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=5432/tcp
firewall-cmd --reload

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/patch-management.service << EOL
[Unit]
Description=Patch Management Application
After=network.target postgresql.service

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PGUSER=postgres
Environment=PGHOST=localhost
Environment=PGDATABASE=patch_management
Environment=PGPASSWORD=postgres
Environment=PGPORT=5432

[Install]
WantedBy=multi-user.target
EOL

# Start the application
echo "Starting the application..."
systemctl daemon-reload
systemctl enable patch-management
systemctl start patch-management

echo "Installation completed!"
echo "The application is now running at https://localhost:443"
echo "You can check the status with: systemctl status patch-management"
echo "PostgreSQL is running on port 5432" 