#!/bin/bash

# Development startup script with error handling and database setup

echo "🚀 Starting development environment..."

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

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

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Start the development server
echo "🚀 Starting Next.js development server..."
exec pnpm dev
