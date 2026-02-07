#!/usr/bin/env bash
set -euo pipefail

IMAGE=egirls-banhammer-bot
PROJECT=egirls-banhammer-bot

mkdir -p logs data
sudo chown -R 1000:1000 logs data

docker rm -f egirls-crypto-banhammer-telegram-bot || true

docker build -t "$IMAGE" .

COMPOSE_PROJECT_NAME=$PROJECT docker compose up -d