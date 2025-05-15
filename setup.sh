#!/bin/bash

echo "🚀 Setting up Nidoe Smart Study Helper..."

# Install dependencies
echo "📦 Installing npm packages..."
npm install \
  next@14.2.3 \
  react@18.2.0 \
  react-dom@18.2.0 \
  typescript@5 \
  @types/node@20 \
  @types/react@18 \
  @types/react-dom@18 \
  tailwindcss@3.3.2 \
  postcss@8.4.24 \
  autoprefixer@10.4.14 \
  eslint@8 \
  eslint-config-next@14.2.3 \
  @hookform/resolvers@3.3.4 \
  @radix-ui/react-avatar@1.0.4 \
  @radix-ui/react-dialog@1.0.5 \
  @radix-ui/react-dropdown-menu@2.0.6 \
  @radix-ui/react-label@2.0.2 \
  @radix-ui/react-progress@1.0.3 \
  @radix-ui/react-select@2.0.0 \
  @radix-ui/react-slider@1.1.2 \
  @radix-ui/react-slot@1.0.2 \
  @radix-ui/react-switch@1.0.3 \
  @radix-ui/react-tabs@1.0.4 \
  @radix-ui/react-toast@1.1.5 \
  class-variance-authority@0.7.0 \
  clsx@2.1.0 \
  firebase@10.8.0 \
  lucide-react@0.363.0 \
  next-themes@0.2.1 \
  react-hook-form@7.51.1 \
  tailwind-merge@2.2.1 \
  tailwindcss-animate@1.0.7 \
  zod@3.22.4

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p public

echo "✅ Setup complete! Next steps:"
echo "1. Add favicon.png and apple-icon.png to the public directory"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Happy studying! 📚" 