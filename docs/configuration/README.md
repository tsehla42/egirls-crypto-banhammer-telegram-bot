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

### spam-rules.ts

**Path:** `src/spam-rules.ts`

TypeScript file exporting categorized regex spam rules. All entries are regex patterns with the `i` flag (case-insensitive).

```typescript
const CURRENCY = '(?:грн|[$€₽₴])';
const AMOUNT = `(?:${CURRENCY}\\s*\\d+|\\d+[\\s\\d]*\\s*${CURRENCY})`;

export const spamRules = {
  earnings: [
    new RegExp(`${AMOUNT}\\s*(?:в\\s+неделю|/неделя)`, 'i'),
    // ...
  ],
  housing: [/помощь с жиль/i, // ...],
  crypto: [/claim (?:free|here|it)/i, // ...],
  contactRequests: [/пиши в лс/i, // ...],
  jobScam: [/чат менеджер/i, // ...],
  gambling: [/беттинг/i, // ...],
  genericSpam: [/solana/i, // ...],
} as const;

export const allSpamRules: RegExp[] = Object.values(spamRules).flat();
```

**Matching behavior:**
- All rules are case-insensitive regex
- Text is NFC-normalized before matching
- First matching rule wins
- Rules are imported at startup — restart bot after changes

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
