---
applyTo: '**'
---

# Agent Instructions — egirls-crypto-banhammer-telegram-bot

## Project Overview

Telegram bot for moderating group chats against spam accounts. Written in TypeScript with grammY framework. Runs via Docker in production. See [docs/README.md](docs/README.md) for full project documentation.

## Documentation

- [Architecture](docs/architecture/) — Directory structure, message flow, skip logic, caching
- [Validators](docs/validators/) — All 5 rules, algorithms, thresholds, how to add new rules
- [Services](docs/services/) — Ban, reply, forwarding, logging, permissions, chat registry
- [Deployment](docs/deployment/) — Dockerfile, docker-compose, commands
- [Configuration](docs/configuration/) — Environment variables, spam data files, log format

## Code Conventions

- All source in `src/`, compiled to `dist/`
- Services are stateless functions, exported from barrel `index.ts`
- Validators return match info or null; the orchestrator (`validateMessage`) builds `ValidationResult`
- Use `console.log` / `console.error` with `[ServiceName]` prefix for logging
- grammY `Context` is passed through handlers; avoid storing state between messages

## Do Not

- Do not create .md files unless explicitly asked
- Do not commit changes without user approval
- Do not modify `spam-keywords.json` or `spam-patterns.json` without understanding the impact — these directly control who gets banned

## Notes for Tools

- Use context7 to get info about grammY and Telegram Bot API
- Use `fd` and `rg` in terminal, preferable over `grep` and `find`
