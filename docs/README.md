# Banhammer Bot Documentation

Telegram bot for moderating group chats against spam accounts. Written in TypeScript with grammY framework.

## Overview

Bot monitors a Telegram group chat (linked to a channel for comments). Each new message is validated against moderation rules. Violating users are banned, their messages deleted, and the violation is logged.

## Documentation

- [Architecture](architecture/) - Project structure, message flow, skip logic
- [Validators](validators/) - All moderation rules (mixed alphabet, Greek, Korean, Chinese, keywords)
- [Services](services/) - Ban, reply, forwarding, logging, permissions, chat registry
- [Deployment](deployment/) - Docker setup, production commands
- [Configuration](configuration/) - Environment variables

## Modules

### bot.ts
Entry point. Creates grammY `Bot` instance, registers handlers, starts polling.
- `ban` command → `handleBanCommand(ctx)` (registered before message handler)
- `message` event → `handleMessage(ctx)`
- `edited_message` event → `handleMessage(ctx, true)`
- `my_chat_member` event → `handleBotChatMemberUpdate(ctx)`

### config.ts
Loads environment variables via `dotenv` + `env-var`. Exports:
- `API_KEY` — Telegram bot token (required)
- `TEST_USER_ID` — Test user for unban script (required)
- `CHAT_ID` — Target group chat ID (required)
- `ID_VIOLATIONS_LOG_CHANNEL` — Channel for forwarding violating messages (required)
- `WHITELISTED_CHAT_IDS` — Comma-separated chat IDs exempt from moderation (optional)
- `BOT_ADMIN_IDS` — Comma-separated user/channel IDs with bot-wide admin privileges (optional)

### constants.ts
Telegram system account IDs:
- `TELEGRAM_CHANNEL_BOT_ID` (777000) — Service account that forwards channel posts to discussion groups
- `TELEGRAM_ANONYMOUS_CHANNEL_BOT_ID` (136817688) — Channel_Bot used when posting as channel

### handlers/MessageHandler.ts
Main message handler. Orchestrates the validation pipeline:
1. `debugLog(ctx)` — Log message details in non-production
2. `shouldSkipMessage(ctx)` — Check all skip conditions
3. `validateMessage(text)` — Run all moderation rules
4. On violation: `replyToViolatingMessage` → `forwardViolatingMessage` → `banUserAndDeleteMessages`

### handlers/BanCommandHandler.ts
Handles `/ban` command for manual bans by admins. Flow:
1. Check it's a group/supergroup chat
2. Check message is a reply to another message
3. Check sender is authorized (bot admin from BOT_ADMIN_IDS or chat admin)
4. Check bot has ban permission
5. Check target is not protected (bot, owner, admin, linked channel, group itself)
6. Ban target user
7. Delete /ban command message and target message
8. Reply with ban confirmation (unless silent mode)
9. Forward target message to log channel
10. Log ban event

Flags: `/ban s` or `/ban silent` — bans without posting confirmation reply.
Authorization: User is authorized if their user ID or channel ID is in `BOT_ADMIN_IDS`, OR if they are a chat administrator/creator.
Protected targets: Telegram channel bot (777000), linked channel, group itself, bot itself, chat owner, chat admins.

### handlers/ChatMemberHandler.ts
Handles `my_chat_member` updates:
- Bot added to chat → register in chat registry, update permission cache, send welcome message
- Bot removed from chat → deactivate in registry, clear permission cache
- Admin status changed → re-register, update permission cache

### validators/validateMessage.ts
Orchestrates all validation rules. Runs rules in order, returns first match:
1. Mixed alphabet rule (`findMixedAlphabetWord`)
2. Keyword rule (`findSpamKeyword`)
3. Greek rule (`findGreek`)
4. Korean rule (`findKorean`)
5. Chinese rule (`findChinese`)

Returns `ValidationResult` with `isValid`, `ruleName`, `triggerWord`, `isPattern`, `isEdit`.

### validators/mixedAlphabetRule.ts
Detects character confusion attacks. A word is flagged if any non-dominant alphabet appears 2+ times. Supported alphabets: Latin, Cyrillic (Russian + Ukrainian extended: іїєґІЇЄҐ).

### validators/greekRule.ts
Detects Greek alphabet characters (U+0370–U+03FF, U+1F00–U+1FFF). Any Greek character triggers a ban.

### validators/koreanRule.ts
Counts Korean (Hangul) characters. Bans if count exceeds threshold (15). Covers Jamo, Compatibility Jamo, Syllables, and Extended ranges.

### validators/chineseRule.ts
Counts CJK (Chinese/Han) characters. Bans if count exceeds threshold (4). Covers CJK Unified Ideographs, Extension A, Compatibility, and Extension B.

### validators/keywordRule.ts
Matches against spam keywords and regex patterns loaded from JSON files:
- `references/spam-keywords.json` — Array of strings, case-insensitive substring match
- `references/spam-patterns.json` — Array of regex pattern strings, compiled with `'i'` flag

Both lists are cached in memory after first load. Restart bot after changes.

### validators/alphabetUtils.ts
Utility to classify characters by alphabet:
- `'cyrillic'` — U+0400–U+04FF
- `'latin'` — A-Z, a-z
- `null` — non-letter or other script

### services/BanService.ts
Bans user and deletes violating message:
1. Delete the violating message via `api.deleteMessage`
2. Ban user via `api.banChatMember`
3. Log ban event via `logBan`

### services/ReplyService.ts
Replies to violating message with ban reason. Format:
```
🖕 Banned user <name>
Reason: <formatted reason>
```
Includes "Edited message" label if triggered by message edit.

### services/ForwardingService.ts
Forwards violating message to the logging channel before deletion. Preserves all original metadata (sender, timestamp, etc.). Uses `disable_notification: true`.

### services/SkipCheckService.ts
Pre-validation skip logic. Message is skipped if:
- Not a group/supergroup chat
- Chat is in `WHITELISTED_CHAT_IDS`
- Sender is Telegram channel service account (777000)
- Sender is anonymous admin (sender_chat === chat)
- Bot lacks ban permission (`can_restrict_members`)
- Sender is a chat administrator
- Sender is posting as the linked channel

### services/ChatPermissionService.ts
Permission checks with caching:
- `isBotAllowedToBan` — Checks bot has `can_restrict_members` (cached 25 min)
- `isUserAdmin` — Checks if user is admin/creator (cached 8 hours)
- `getLinkedChannelId` — Gets linked channel for supergroup (cached 240 hours)

### services/ChatRegistryService.ts
Tracks which chats the bot is in. Persists to `data/chat-registry.json`:
- `registerChat` — Add or update chat in registry
- `deactivateChat` — Mark chat as inactive
- `getActiveChatIds` / `getActiveChats` / `getAllChats` — Query registry

### services/LogService.ts
Logs ban events to per-chat log files in `logs/` directory. Filename format: `{username}-{title}{chatId}.ban.log`. Log line format:
```
2026-01-31T12:00:00.000Z John Doe @johndoe 1234567890 greek_rule σκύλος
```

### utils/ban.utils.ts
Shared ban utilities:
- `deleteMessage(api, chatId, messageId)` — Delete message, ignoring errors
- `forwardMessageToChannel(api, target, source, messageId)` — Forward message to channel
- `resolveTargetFromReply(replyTo)` — Get user/chat from reply_to_message
- `resolveTargetName(replyTo)` — Display name from reply_to_message
- `resolveLogUser(replyTo, targetId)` — User object for logging
- `isKnownBanFailure(error)` — Check for self/owner/admin ban errors
- `parseBanFlags(text)` — Parse `/ban s` or `/ban silent` flags

### utils/formatters.utils.ts
Formatting utilities:
- `formatValue` — Display value or "-" for missing
- `formatUsername` — Add @ prefix or "-"
- `formatUserIdentifier` — Best human-readable name from User object
- `formatChatIdentifier` — Best human-readable name from Chat object
- `getChatUsername` / `getChatTitle` — Extract from Chat object
- `formatBanReason` / `formatBanReasonPlain` — Format ban reason for HTML reply or plain text log
- `escapeHtml` — Escape HTML special characters for safe Telegram messages

### utils/debug.utils.ts
Debug logging helper. In non-production, logs chat/user/message details to console.

## Data Flow

```
Message arrives in group chat
    |
    v
bot.ts: message/edited_message handler
    |
    v
MessageHandler.handleMessage()
    |
    +-- debugLog(ctx) — console output in dev mode
    |
    +-- shouldSkipMessage(ctx)
    |   +-- Not a group? → skip
    |   +-- Whitelisted chat? → skip
    |   +-- Telegram system account (777000)? → skip
    |   +-- Anonymous admin? → skip
    |   +-- Bot can't ban? → skip
    |   +-- Sender is admin? → skip
    |   +-- Posting as linked channel? → skip
    |
    +-- validateMessage(text)
    |   +-- Mixed alphabet rule → character confusion attack?
    |   +-- Keyword rule → spam keyword or regex match?
    |   +-- Greek rule → Greek characters present?
    |   +-- Korean rule → >15 Korean characters?
    |   +-- Chinese rule → >4 Chinese characters?
    |   +-- All pass → isValid: true (no action)
    |
    +-- [VIOLATION FOUND]
        |
        +-- replyToViolatingMessage()
        |   Reply to message: "🖕 Banned user <name>\nReason: <reason>"
        |
        +-- forwardViolatingMessage()
        |   Forward violating message to log channel (silent)
        |
        +-- banUserAndDeleteMessages()
            +-- Delete violating message
            +-- Ban user from chat
            +-- logBan() → write to logs/{chat}.ban.log

Bot added to new chat
    |
    v
ChatMemberHandler.handleBotChatMemberUpdate()
    |
    +-- registerChat() → data/chat-registry.json
    +-- updateBotPermissionCache()
    +-- Send welcome message with setup instructions
```

## External Dependencies

- **grammy** — Telegram Bot API wrapper (v1.39+)
- **dotenv** — .env file loading
- **env-var** — Environment variable validation
- **typescript** — Compile to CommonJS (ES2020 target)

## Deployment

Multi-stage Docker build. See [Deployment](deployment/) for details.

```bash
# Using bot.sh (recommended)
./bot.sh compose    # Build and restart container
./bot.sh update     # Pull changes and rebuild
./bot.sh deploy     # Deploy to production server

# Manual
docker compose up --build -d   # Build and start
docker compose logs -f         # Watch logs
```
