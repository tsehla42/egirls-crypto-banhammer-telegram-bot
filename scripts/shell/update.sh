#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "Pulling latest changes..."
git pull

echo "Rebuilding and restarting bot..."
bash "$SCRIPT_DIR/compose.sh"

echo "Done."
