# Architecture

Project structure and message processing flow.

## Directory Structure

```
src/
  bot.ts                        # Entry point — registers handlers, starts polling
  config.ts                     # Environment variable loading (dotenv + env-var)
  constants.ts                  # Telegram system account IDs
  handlers/
    index.ts                    # Barrel export
    MessageHandler.ts           # Main message handler — validates, bans, forwards
    ChatMemberHandler.ts        # Bot added/removed from chat events
  services/
    index.ts                    # Barrel export
    BanService.ts               # Ban user + delete violating message
    ChatPermissionService.ts    # Check bot permissions and user admin status
    ChatRegistryService.ts      # Track which chats the bot is in
    ForwardingService.ts        # Forward violating message to log channel
    LogService.ts               # Logging ban events to per-chat files
    ReplyService.ts             # Reply to violating message with ban reason
    SkipCheckService.ts         # Pre-validation skip logic
  validators/
    index.ts                    # Barrel export
    alphabetUtils.ts            # Classify characters by alphabet
    chineseRule.ts              # Detect Chinese (CJK) characters
    greekRule.ts                # Detect Greek alphabet characters
    keywordRule.ts              # Match spam keywords and regex patterns
    koreanRule.ts               # Detect Korean (Hangul) characters
    mixedAlphabetRule.ts        # Detect mixed-alphabet character confusion
    validateMessage.ts          # Orchestrator — runs all rules
  utils/
    index.ts                    # Barrel export
    debug.utils.ts              # Debug logging (non-production only)
    formatters.utils.ts         # Format ban reasons, user identifiers
references/
  spam-keywords.json            # Banned keyword strings
  spam-patterns.json            # Regex patterns for spam detection
```

## Message Processing Flow

### Normal Message

```
1. bot.ts receives "message" event
2. MessageHandler.handleMessage(ctx)
3. debugLog(ctx) — console.log in non-production
4. shouldSkipMessage(ctx) — see Skip Logic below
5. validateMessage(text) — see Validators below
6. If invalid:
   a. replyToViolatingMessage(ctx, validation)
   b. forwardViolatingMessage(ctx, logChannelId)
   c. banUserAndDeleteMessages(ctx, validation)
      - deleteMessage(chatId, messageId)
      - banChatMember(chatId, userId)
      - logBan(data) → logs/{chat}.ban.log
```

### Edited Message

Same flow as normal message, but `isEdit = true`. The ban reason reply includes "Edited message" label.

### Bot Chat Member Update

```
1. bot.ts receives "my_chat_member" event
2. ChatMemberHandler.handleBotChatMemberUpdate(ctx)
3. If bot added (left/kicked → member/administrator):
   - registerChat(chat) → data/chat-registry.json
   - updateBotPermissionCache(chatId, canBan)
   - Send welcome message with setup instructions
4. If bot removed (member/administrator → left/kicked):
   - deactivateChat(chatId)
   - updateBotPermissionCache(chatId, false)
5. If admin status changed:
   - registerChat(chat)
   - updateBotPermissionCache(chatId, canBan)
```

## Skip Logic

`SkipCheckService.shouldSkipMessage(ctx)` returns `true` (skip) if any condition is met:

| Condition | Why |
|-----------|-----|
| Not a group/supergroup | Bot only moderates group chats |
| Chat in `WHITELISTED_CHAT_IDS` | Admin exempted this chat |
| `from.id === 777000` | Telegram service account forwarding channel posts |
| `sender_chat === chat.id` | Anonymous admin posting as the chat itself |
| Bot lacks `can_restrict_members` | Bot can't ban without this permission |
| Sender is admin/creator | Don't moderate administrators |
| Posting as linked channel via Channel_Bot | Channel owner posting in their linked discussion |

### Permission Caching

`ChatPermissionService` caches three things in memory:

| Cache | TTL | Key |
|-------|-----|-----|
| Bot ban permission | 25 min | `chatId` |
| User admin status | 8 hours | `chatId:userId` |
| Linked channel ID | 240 hours | `chatId` |

## Validation Pipeline

`validateMessage(text)` runs rules in order. First match wins:

```
1. findMixedAlphabetWord(text)
   → word with 2+ non-dominant alphabet chars → ban
2. findSpamKeyword(text)
   → substring match against keywords.json OR regex match against patterns.json → ban
3. findGreek(text)
   → any Greek character (U+0370–U+03FF, U+1F00–U+1FFF) → ban
4. findKorean(text)
   → >15 Korean (Hangul) characters → ban
5. findChinese(text)
   → >4 Chinese (CJK) characters → ban
6. All pass → { isValid: true }
```

## Chat Registry

`ChatRegistryService` persists chat info to `data/chat-registry.json`:

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

## Logging

Ban events are logged to per-chat files in `logs/` directory.

**Filename format:** `{chatUsername}-{chatTitle}{chatId}.ban.log`

**Log line format:**
```
2026-01-31T12:00:00.000Z John Doe @johndoe 1234567890 greek_rule σκύλος
2026-01-31T12:01:00.000Z Jane Smith @janesmith 9876543210 keyword_rule "free crypto" [edit]
```

Fields: `timestamp firstName lastName @username userId ruleName triggerWord [edit]`

## Related

- [Validators](../validators/) — Rule implementations
- [Services](../services/) — Service implementations
- [Configuration](../configuration/) — Environment variables
