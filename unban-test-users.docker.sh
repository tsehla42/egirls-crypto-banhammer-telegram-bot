#!/bin/bash

# Unban test user from all groups in the Docker container
docker exec egirls-crypto-banhammer-telegram-bot npm run unban-test-user
