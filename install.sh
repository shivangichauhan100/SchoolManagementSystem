#!/bin/bash

echo "🚀 Setting up School Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Create server environment file
if [ ! -f .env ]; then
    echo "🔧 Creating server environment file..."
    cp env.example .env
    echo "⚠️  Please update server/.env with your configuration"
fi

cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install

# Create client environment file
if [ ! -f .env.local ]; then
    echo "🔧 Creating client environment file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
fi

cd ..

echo ""
echo "✅ Installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your MongoDB connection string and JWT secret"
echo "2. Start MongoDB service"
echo "3. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend API will be available at: http://localhost:5000"
echo ""
echo "📚 For more information, check the README.md file"
