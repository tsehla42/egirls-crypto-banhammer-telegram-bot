#!/usr/bin/env bash
set -euo pipefail

PROJECT=egirls-banhammer-bot

clear

elapsed() {
  awk "BEGIN {printf \"%.1fs\", $1 / 1000000000}"
}

SCRIPT_START=$(date +%s%N)

mkdir -p logs data

docker compose down 2>/dev/null || true

docker compose build --no-cache

COMPOSE_PROJECT_NAME=$PROJECT docker compose up -d --build

SCRIPT_END=$(date +%s%N)
ELAPSED=$((SCRIPT_END - SCRIPT_START))
echo "=== Total: $(elapsed $ELAPSED) ==="

docker logs egirls-crypto-banhammer-telegram-bot -f
