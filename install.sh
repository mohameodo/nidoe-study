#!/bin/bash

echo "🚀 Starting Nidoe Smart Study Helper installation..."

# Install dependencies
echo "📦 Installing npm packages..."
npm install

# Copy environment example file
echo "🔧 Creating environment file template..."
cp .env.local.example .env.local 2>/dev/null || echo "⚠️ .env.local.example not found, skipping..."

echo "✅ Installation complete! Next steps:"
echo "1. Edit .env.local with your Firebase and OpenAI API credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Happy studying! 📚" 