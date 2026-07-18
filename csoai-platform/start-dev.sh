#!/bin/bash
# CSOAI Development Server Startup Script
# Run this to start both frontend and backend

echo "🚀 Starting CSOAI Platform..."
echo ""

# Kill any existing processes on our ports
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true

# Start the backend server
echo "📡 Starting backend server on port 3001..."
NODE_ENV=development npx tsx server/index.ts &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start the frontend with polling enabled (for VM environments)
echo "🎨 Starting frontend server on port 5173..."
cd client && npx vite --host &
FRONTEND_PID=$!

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     CSOAI Platform Ready                       ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  🌐 Frontend: http://localhost:5173                           ║"
echo "║  📡 Backend:  http://localhost:3001                           ║"
echo "║  🔗 API:      http://localhost:3001/api/trpc                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait
