#!/usr/bin/env bash
set -euo pipefail

PROJECT=egirls-banhammer-bot

echo "Stopping dev container..."
COMPOSE_PROJECT_NAME=$PROJECT docker compose down --rmi all --volumes 2>&1 || true

echo ""
echo "Cleaning up any remaining containers..."
if docker inspect egirls-crypto-banhammer-telegram-bot >/dev/null 2>&1; then
  docker rm -f egirls-crypto-banhammer-telegram-bot >/dev/null
  echo "Removed leftover container."
else
  echo "No leftover containers to remove."
fi

echo ""
echo "Dev cleanup complete."
