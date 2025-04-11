# Patch Management Application

A modern patch management application similar to NinjaOne, built with React and Node.js.

## Features

- Secure HTTPS server running on port 443
- Modern React frontend
- RESTful API backend
- User authentication
- Patch management dashboard
- Device monitoring
- Patch deployment scheduling

## System Requirements

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- 2GB RAM minimum
- 1GB free disk space

## Quick Installation

### Windows
1. Download the latest release
2. Extract the files to your desired location
3. Run `install.ps1` as Administrator
4. The application will be available at `https://localhost:443`

### Linux
1. Download the latest release
2. Extract the files to your desired location
3. Make the install script executable:
   ```bash
   chmod +x install.sh
   ```
4. Run the installation script:
   ```bash
   sudo ./install.sh
   ```
5. The application will be available at `https://localhost:443`

## Manual Installation

1. Install Node.js (v16 or higher)
2. Install MongoDB (v4.4 or higher)
3. Clone the repository
4. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   ```
5. Build the client:
   ```bash
   cd client
   npm run build
   ```
6. Generate SSL certificates:
   ```bash
   mkdir ssl
   openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes -subj "/CN=localhost"
   ```
7. Start the application:
   ```bash
   npm start
   ```

## Configuration

The application can be configured using environment variables in the `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/patch_management
JWT_SECRET=your_jwt_secret_key_here
PORT=443
NODE_ENV=development
```

## Security

- All communication is encrypted using HTTPS
- JWT-based authentication
- Secure password hashing
- CORS protection
- Input validation

## Troubleshooting

1. If the application fails to start:
   - Check if MongoDB is running
   - Verify SSL certificates are present in the `ssl` directory
   - Check the application logs

2. If you can't access the application:
   - Verify the port (443) is not blocked by your firewall
   - Check if another service is using port 443
   - Try accessing via `https://localhost:443`

## Support

For support, please open an issue in the GitHub repository.

## License

MIT 