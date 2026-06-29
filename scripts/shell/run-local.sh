#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

if [ ! -d "node_modules" ]; then
  echo "No node_modules found. Installing dependencies..."
  npm install
fi

echo "Starting bot in development mode..."
npm run dev
