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
dnf install -y openssl tar gzip

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
dnf install -y nodejs

# Install MongoDB
echo "Installing MongoDB..."
cat > /etc/yum.repos.d/mongodb-org-4.4.repo << EOL
[mongodb-org-4.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/4.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.4.asc
EOL

dnf install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Create application directory
echo "Setting up application directory..."
APP_DIR="/opt/patch-management"
mkdir -p $APP_DIR
cd $APP_DIR

# Extract the application package if it exists
if [ -f "patch-management.tar.gz" ]; then
  echo "Extracting application package..."
  tar -xzf patch-management.tar.gz
fi

# Install application dependencies
echo "Installing application dependencies..."
npm install

# Generate SSL certificates
echo "Generating SSL certificates..."
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes -subj "/CN=localhost"

# Configure firewall
echo "Configuring firewall..."
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/patch-management.service << EOL
[Unit]
Description=Patch Management Application
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

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