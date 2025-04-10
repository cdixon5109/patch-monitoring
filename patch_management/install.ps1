# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js..."
    # Download and install Node.js
    $nodeUrl = "https://nodejs.org/dist/v16.20.0/node-v16.20.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i $nodeInstaller /quiet" -Wait
    Remove-Item $nodeInstaller
}

# Check if MongoDB is installed
if (!(Get-Command mongod -ErrorAction SilentlyContinue)) {
    Write-Host "Installing MongoDB..."
    # Download and install MongoDB
    $mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-4.4.18-signed.msi"
    $mongoInstaller = "$env:TEMP\mongo-installer.msi"
    Invoke-WebRequest -Uri $mongoUrl -OutFile $mongoInstaller
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i $mongoInstaller /quiet" -Wait
    Remove-Item $mongoInstaller

    # Start MongoDB service
    Start-Service -Name "MongoDB"
    Set-Service -Name "MongoDB" -StartupType Automatic
}

# Install dependencies
Write-Host "Installing dependencies..."
npm install

# Generate SSL certificates if not present
if (!(Test-Path "ssl\private.key") -or !(Test-Path "ssl\certificate.crt")) {
    Write-Host "Generating SSL certificates..."
    if (!(Test-Path "ssl")) {
        New-Item -ItemType Directory -Path "ssl"
    }
    
    # Generate self-signed certificate
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My"
    $certPath = "cert:\LocalMachine\My\$($cert.Thumbprint)"
    Export-Certificate -Cert $certPath -FilePath "ssl\certificate.crt"
    $cert.PrivateKey.Export("ssl\private.key")
}

# Start the application
Write-Host "Starting the application..."
npm start 