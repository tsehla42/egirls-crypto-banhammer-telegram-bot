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
- [Deployment](docs/deployment/) — Dockerfile, docker-compose, bot.sh commands
- [Configuration](docs/configuration/) — Environment variables, log format
- [Incidents](docs/incidents/) — Post-incident reports, prevention checklists

## Code Conventions

- All source in `src/`, compiled to `dist/`
- Services are stateless functions, exported from barrel `index.ts`
- Validators return match info or null; the orchestrator (`validateMessage`) builds `ValidationResult`
- Use `console.log` / `console.error` with `[ServiceName]` prefix for logging
- grammY `Context` is passed through handlers; avoid storing state between messages

## Do Not

- Do not create .md files unless explicitly asked
- Do not commit changes without user approval
- Spam rules live in `src/spam-rules.ts` — they directly control who gets banned; all entries must be regex with the `i` flag
- Do not use unescaped angle brackets in strings sent with `parse_mode: "HTML"` — `<` must be `&lt;`, `>` must be `&gt;` unless it's a known Telegram tag (`<b>`, `<i>`, `<code>`, `<a>`). See [Incidents](docs/incidents) for a real example of this causing silent failures.

## Operations

- Pull bot logs from prod: `./bot.sh pull-data`
- Run tests: `npm test`
- **Spam rule batches:** `npm run probe -- <file>` (JSON array, `---`-separated text, or `-` for stdin) runs messages through the real pipeline (banned_channel → mixed → keyword → greek → korean → chinese). PASSED = needs new rules (analyze full text); FLAGGED = harvest extra markers from the `also matches` lines. After adding rules: re-probe → promote batch to `src/validators/__tests__/recentSpamMessages.test.ts` → `npm test` → increment `version` in `package.json` by 0.0.1 → `npm install` to update the lockfile

**Deploy timing:** `./bot.sh deploy` runs remotely and can take several minutes. Run it and return without waiting for it to finish — the script handles everything internally.

**Production bot:** If asked to check logs, verify behavior, or inspect anything on the running prod bot, SSH to server and use `docker logs` or `docker exec`. See [docs/deployment/](docs/deployment/) for full deployment details and server the bot is running on.

## Notes for Tools

- Use context7 to get info about grammY and Telegram Bot API
- Use `fd` and `rg` in terminal, preferable over `grep` and `find`
