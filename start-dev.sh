#!/bin/bash

# NOISE Application - Development Startup Script
# This script helps you run the application in development mode

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║           NOISE Application - Dev Setup             ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed."
        exit 1
    fi
}

check_command "docker"
check_command "node"
check_command "npm"

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker-compose up -d postgres
echo "✅ PostgreSQL started"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Run database migrations
echo "🗃️  Running database migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start backend in background
echo "🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Start frontend
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║              NOISE is now running!                  ║"
echo "╠════════════════════════════════════════════════════╣"
echo "║  Frontend:    http://localhost:5173                 ║"
echo "║  Backend:     http://localhost:3001                 ║"
echo "║  API Docs:    http://localhost:3001/api/docs        ║"
echo "║  PostgreSQL:  localhost:5432                        ║"
echo "╠════════════════════════════════════════════════════╣"
echo "║  Press Ctrl+C to stop all services                  ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Handle graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    docker-compose stop postgres
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
