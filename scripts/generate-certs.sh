#!/bin/bash

# Script to generate self-signed SSL certificates for HTTP/2 development

CERT_DIR="./certs"
DAYS=365
COUNTRY="US"
STATE="State"
CITY="City"
ORG="Organization"
UNIT="IT Department"
COMMON_NAME="localhost"

echo "🔐 Generating SSL certificates for HTTP/2..."

# Create certificates directory
mkdir -p "$CERT_DIR"

# Generate private key
openssl genrsa -out "$CERT_DIR/key.pem" 2048

# Generate certificate signing request
openssl req -new -key "$CERT_DIR/key.pem" -out "$CERT_DIR/csr.pem" -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$UNIT/CN=$COMMON_NAME"

# Generate self-signed certificate
openssl x509 -req -days $DAYS -in "$CERT_DIR/csr.pem" -signkey "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.pem"

# Set appropriate permissions
chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

# Clean up CSR file
rm "$CERT_DIR/csr.pem"

echo "✅ SSL certificates generated successfully!"
echo "📜 Certificate: $CERT_DIR/cert.pem"
echo "🔑 Private key: $CERT_DIR/key.pem"
echo "⏰ Valid for: $DAYS days"
