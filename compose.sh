#!/usr/bin/env bash
set -euo pipefail

IMAGE=egirls-banhammer-bot
PROJECT=egirls-banhammer-bot

mkdir -p logs data
sudo chown -R 1000:1000 logs data

# Start with the new image (--force-recreate ensures container is rebuilt)
COMPOSE_PROJECT_NAME=egirls-banhammer-bot docker compose up -d --build --force-recreate --no-deps