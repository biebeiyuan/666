#!/usr/bin/env bash
# Build script for Render

echo "Building client..."
cd client
npm install
npm run build

echo "Installing server dependencies..."
cd ../server
npm install

echo "Build complete!"
