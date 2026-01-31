#!/usr/bin/env bash
set -euo pipefail

IMAGE=egirls-banhammer-bot
PROJECT=egirls-banhammer-bot

docker build -t "$IMAGE" .

COMPOSE_PROJECT_NAME=$PROJECT docker compose up -d