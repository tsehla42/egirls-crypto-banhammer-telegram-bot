# Deployment

Docker-based production deployment.

## Docker Setup

### Dockerfile

Multi-stage build:

**Build stage** (`node:22.14.0-alpine`):
1. `npm ci` — install dependencies (with bind mount + cache for speed)
2. Copy source files
3. `npm run compile` — TypeScript → JavaScript

**Runtime stage** (`node:22.14.0-alpine`):
1. Copy `package.json`, `node_modules`, `dist/` from build stage
2. Copy `references/` (spam keywords/patterns)
3. Copy `scripts/` (utility scripts)
4. Copy `src/config.ts` and `src/services/ChatRegistryService.ts` (needed at runtime)
5. Create `logs/` and `data/` directories
6. Run as non-root `node` user

### docker-compose.yml

```yaml
services:
  bot:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: egirls-crypto-banhammer-telegram-bot
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/usr/src/app/logs
      - ./data:/usr/src/app/data
```

**Volumes:**
- `./logs:/usr/src/app/logs` — Persistent ban log files
- `./data:/usr/src/app/data` — Chat registry (`chat-registry.json`)

## Commands

### Build and Start

```bash
# Build and start (detached)
docker compose up --build -d

# Rebuild without cache (when dependencies change)
docker compose build --no-cache
docker compose up -d
```

### Monitoring

```bash
# Watch live logs
docker compose logs -f

# View last 100 lines
docker compose logs --tail 100

# Check container status
docker compose ps
```

### Management

```bash
# Stop and remove container
docker compose down

# Stop, remove, and delete volumes
docker compose down -v

# Shell into running container
docker compose exec bot sh

# Restart container
docker compose restart
```

### Utility Scripts

```bash
# List groups the bot is in
npm run list-groups

# Unban a test user (uses TEST_USER_ID from .env)
npm run unban-test-user
```

### Bot Management Scripts

Use `./bot.sh` for a menu interface to common operations:

```bash
# Show menu
./bot.sh

# Run specific scripts
./bot.sh deploy       # Fetch + reset, then run update script
./bot.sh update       # Git pull, run compose script
./bot.sh compose      # Build image and restart container
./bot.sh pull-data    # Pull data from production server
./bot.sh run-local    # Run bot locally with npm
```

Scripts are located in `scripts/shell/`:
- `compose.sh` — Build and restart Docker container
- `update.sh` — Pull changes and rebuild
- `deploy.sh` — Deploy to production server (gitignored)
- `pull-data.sh` — Pull data from production (gitignored)
- `run-local.sh` — Run bot locally with npm

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode (compile + auto-restart)
npm run dev
```

This runs two processes concurrently:
- `watch-compile` — TypeScript compiler in watch mode
- `bot` — nodemon watching `dist/` for changes

### Compile Only

```bash
npm run compile
```

Output goes to `dist/` directory.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in required values (see [Configuration](../configuration/))
3. Build and start: `docker compose up --build -d`

## File Structure on Disk

```
project/
├── .env                    # Environment variables (gitignored)
├── bot.sh                  # Menu interface for scripts
├── docker-compose.yml      # Container configuration
├── Dockerfile              # Multi-stage build
├── src/                    # TypeScript source
├── dist/                   # Compiled JavaScript (generated)
├── references/             # Spam keywords and patterns
│   ├── spam-keywords.json
│   └── spam-patterns.json
├── logs/                   # Ban log files (created at runtime)
│   └── {chat}.ban.log
├── data/                   # Persistent data (created at runtime)
│   └── chat-registry.json
└── scripts/                # Utility scripts
    ├── shell/              # Shell scripts for bot management
    │   ├── compose.sh
    │   ├── update.sh
    │   ├── deploy.sh       # gitignored
    │   ├── pull-data.sh    # gitignored
    │   └── run-local.sh
    ├── list-bot-groups.ts
    ├── unban-test-user.ts
    └── extract-keyword-spam.ts
```

## Related

- [Configuration](../configuration/) — Environment variables
- [Architecture](../architecture/) — Project structure
