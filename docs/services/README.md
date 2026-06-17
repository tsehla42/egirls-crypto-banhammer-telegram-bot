# Services

Stateless service modules that handle bot actions after validation. All services are exported from `src/services/index.ts`.

## Overview

When a message fails validation, the following services are called in order:

```
Violation detected
    |
    +-- ReplyService.replyToViolatingMessage()
    |   Reply to message with ban reason
    |
    +-- ForwardingService.forwardViolatingMessage()
    |   Forward violating message to log channel
    |
    +-- BanService.banUserAndDeleteMessages()
        Delete message → Ban user → Log event
```

## Services

### BanService

**File:** `BanService.ts`

Bans the violating user and deletes their message.

```typescript
banUserAndDeleteMessages(ctx: Context, validation: ValidationResult): Promise<void>
```

**Steps:**
1. Delete the violating message via `ctx.api.deleteMessage(chatId, messageId)`
2. Ban user via `ctx.api.banChatMember(chatId, userId)`
3. Log ban event via `logBan(data)` if ruleName and triggerWord are present

**Error handling:** Each step has independent try/catch. If message deletion fails, banning still proceeds. If banning fails, the function returns early (no log written).

---

### ReplyService

**File:** `ReplyService.ts`

Replies to the violating message with a ban reason.

```typescript
replyToViolatingMessage(ctx: Context, validation: ValidationResult): Promise<void>
```

**Reply format (HTML):**
```
🖕 Banned user <b>John Doe</b>
Reason: Message contains Greek alphabet symbol in word <code>σκύλος</code>
```

If the violation was from an edited message, includes "Edited message" label:
```
🖕 Banned user <b>John Doe</b>
Edited message
Reason: Message contains spam keyword <code>free crypto</code>
```

Uses `reply_parameters: { message_id }` to reply directly to the violating message.

---

### ForwardingService

**File:** `ForwardingService.ts`

Forwards the violating message to a logging channel before it gets deleted.

```typescript
forwardViolatingMessage(ctx: Context, loggingChannelId: number): Promise<void>
```

- Uses `ctx.api.forwardMessage()` to preserve all original metadata (sender, timestamp, etc.)
- Uses `disable_notification: true` to avoid noisy notifications in the log channel
- Silently logs errors without throwing

---

### SkipCheckService

**File:** `SkipCheckService.ts`

Evaluates all pre-validation skip conditions. Returns `true` if the message should be ignored.

```typescript
shouldSkipMessage(ctx: Context): Promise<boolean>
```

**Skip conditions (in order):**

| # | Condition | Check |
|---|-----------|-------|
| 1 | Not a group chat | `chat.type !== "group" && chat.type !== "supergroup"` |
| 2 | Whitelisted chat | `WHITELISTED_CHAT_IDS.includes(chat.id)` |
| 3 | Telegram channel forward | `from.id === 777000` |
| 4 | Anonymous admin | `sender_chat.id === chat.id` |
| 5 | Bot can't ban | `!isBotAllowedToBan(ctx, chatId)` |
| 6 | Sender is admin | `isUserAdmin(ctx, chatId, from.id)` |
| 7 | Posting as linked channel | `from.id === 136817688 && sender_chat === linked_channel` |

Condition 7 is only checked when condition 3 is false (i.e., the sender is Channel_Bot, not the Telegram service account).

---

### ChatPermissionService

**File:** `ChatPermissionService.ts`

Permission checks with in-memory caching to reduce Telegram API calls.

```typescript
isBotAllowedToBan(ctx: Context, chatId: number): Promise<boolean>
```
Returns `true` if bot is administrator with `can_restrict_members`. Cached for 25 minutes per chat.

```typescript
isUserAdmin(ctx: Context, chatId: number, userId: number): Promise<boolean>
```
Returns `true` if user is administrator or creator. Cached for 8 hours per `chatId:userId` pair.

```typescript
getLinkedChannelId(ctx: Context, chatId: number): Promise<number | null>
```
Returns the linked channel ID for a supergroup, or `null` if none. Cached for 240 hours per chat.

```typescript
updateBotPermissionCache(chatId: number, canBan: boolean): void
```
Manually update the permission cache (called from ChatMemberHandler when bot permissions change).

**Cache implementation:** Simple `Map` with TTL check. No eviction — entries accumulate but are small.

---

### ChatRegistryService

**File:** `ChatRegistryService.ts`

Tracks which chats the bot is in. Persists to `data/chat-registry.json`.

```typescript
registerChat(chat: Chat): void
```
Add or update a chat in the registry. Only tracks groups, supergroups, and channels.

```typescript
deactivateChat(chatId: number): void
```
Mark a chat as inactive (when bot is removed).

```typescript
getActiveChatIds(): number[]
```
Return chat IDs of all active chats.

```typescript
getActiveChats(): ChatInfo[]
```
Return full info for all active chats.

```typescript
getAllChats(): ChatInfo[]
```
Return all chats (including inactive).

**ChatInfo structure:**
```typescript
interface ChatInfo {
  chatId: number;
  title: string;
  username?: string;
  type: "group" | "supergroup" | "channel";
  addedAt: string;      // ISO timestamp
  isActive: boolean;
}
```

---

### LogService

**File:** `LogService.ts`

Logs ban events to per-chat log files.

```typescript
logBan(data: BanLogData): void
```

**Log directory:** `logs/` (created automatically if missing)

**Filename format:** `{chatUsername}-{chatTitle}{chatId}.ban.log`
- Example: `mygroup-Discussion_Group-1001234567890.ban.log`
- Special characters in chat title are sanitized for filenames

**Log line format:**
```
{timestamp} {firstName} {lastName} {username} {userId} {ruleName} {triggerWord}[edit]
```

**Example lines:**
```
2026-01-31T12:00:00.000Z John Doe @johndoe 1234567890 greek_rule σκύλος
2026-01-31T12:01:00.000Z Jane Smith @janesmith 9876543210 keyword_rule "free crypto"
2026-01-31T12:02:00.000Z - - - 1111111111 mixed_rule Cкладнопiдрядний [edit]
```

Missing values are displayed as `-`.

## Related

- [Validators](../validators/) — Rules that detect violations
- [Architecture](../architecture/) — Message flow and skip logic
