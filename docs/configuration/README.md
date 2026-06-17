# Configuration

Environment variables and reference data files.

## Environment Variables

Loaded via `dotenv` (in non-production) and validated via `env-var` in `src/config.ts`.

### Required

| Variable | Type | Description |
|----------|------|-------------|
| `API_KEY` | string | Telegram bot token from BotFather |
| `TEST_USER_ID` | positive integer | User ID for the unban test script |
| `CHAT_ID` | negative integer | Target group chat ID |
| `ID_VIOLATIONS_LOG_CHANNEL` | negative integer | Chat ID where violating messages are forwarded for logging |

### Optional

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `WHITELISTED_CHAT_IDS` | comma-separated numbers | `""` (empty) | Chat IDs exempt from moderation. Messages in these chats are completely ignored. |

### .env.example

```env
# Required: Telegram bot token (from BotFather)
API_KEY="0000000000:AAA_AAaAAaAaA_AAa_aAAAaaAaaaAAAaA_A"

# Required: ID of a test user to unban
TEST_USER_ID=0000000000

# Required: Your Telegram group chat ID
CHAT_ID=-1000000000000

# Required: Channel ID for forwarding violating messages
ID_VIOLATIONS_LOG_CHANNEL=-1000000000000

# Optional: Comma-separated chat IDs where moderation is disabled
WHITELISTED_CHAT_IDS=-1000000000000,-1000000000001
```

### NODE_ENV

Set automatically by Docker (`NODE_ENV=production`). In local development, defaults to non-production which enables:
- `dotenv` loading from `.env` file
- Debug logging via `debugLog(ctx)`

## Reference Data Files

### spam-keywords.json

**Path:** `references/spam-keywords.json`

JSON array of banned keyword strings. Matched as case-insensitive substrings against message text.

```json
[
  "free crypto",
  "airdrop now",
  "join my channel",
  "earn money fast"
]
```

**Matching behavior:**
- Case-insensitive (`"FREE CRYPTO"` matches `"free crypto"`)
- Substring match (`"free crypto today"` matches `"free crypto"`)
- Empty strings are skipped

### spam-patterns.json

**Path:** `references/spam-patterns.json`

JSON array of regex pattern strings. Compiled with `'i'` flag (case-insensitive).

```json
[
  "t\\.me/\\+",
  "bit\\.ly/",
  "https?://.*\\.xyz"
]
```

**Matching behavior:**
- Standard JavaScript regex syntax
- Case-insensitive (via `'i'` flag)
- Invalid patterns log an error and are skipped
- Full message text is tested against each pattern

### Caching

Both files are loaded once on first message and cached in module-level variables. The cache lives for the lifetime of the process. **Restart the bot after modifying these files.**

## Chat Registry

**Path:** `data/chat-registry.json`

Auto-managed by `ChatRegistryService`. Tracks which chats the bot is in.

```json
{
  "chats": [
    {
      "chatId": -1001234567890,
      "title": "Discussion Group",
      "username": "mygroup",
      "type": "supergroup",
      "addedAt": "2026-01-15T10:30:00.000Z",
      "isActive": true
    }
  ],
  "lastUpdated": "2026-06-01T12:00:00.000Z"
}
```

**Do not edit manually.** The bot manages this file automatically when added to or removed from chats.

## Log Files

**Path:** `logs/`

Per-chat ban log files created by `LogService`. Filename format: `{chatUsername}-{chatTitle}{chatId}.ban.log`

```
logs/
├── mygroup-Discussion_Group-1001234567890.ban.log
├── another_chat-Test_Group-1009876543210.ban.log
└── nousername-Unknown-1001111111111.ban.log
```

Log lines:
```
2026-01-31T12:00:00.000Z John Doe @johndoe 1234567890 greek_rule σκύλος
2026-01-31T12:01:00.000Z Jane Smith @janesmith 9876543210 keyword_rule "free crypto" [edit]
```

## Related

- [Deployment](../deployment/) — Docker setup and commands
- [Validators](../validators/) — How spam data files are used
