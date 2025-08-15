#!/bin/bash

# Production startup script

echo "🚀 Starting production environment..."

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the production server
echo "🚀 Starting Next.js production server..."
echo "📡 HTTP/2 and Brotli compression handled by Nginx reverse proxy"
exec pnpm start
