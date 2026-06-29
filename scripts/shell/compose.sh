#!/usr/bin/env bash
set -euo pipefail

PROJECT=egirls-banhammer-bot

mkdir -p logs data

# Stop and remove existing container if it exists
docker compose down 2>/dev/null || true

docker compose build --no-cache

# Start with the new image
COMPOSE_PROJECT_NAME=$PROJECT docker compose up -d --build

docker compose logs --tail 50
