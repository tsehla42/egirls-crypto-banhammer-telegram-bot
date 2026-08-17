export const MSG = {
  BAN_NO_PERMISSION: "I don't have permission to ban users in this chat.",
  BAN_CONFIRMATION: "🖕 Banned user <b>{name}</b>",
  BAN_FAILED: "Failed to ban user: {error}",
  REASON_MANUAL_BAN: "\nReason: manual ban by {admin}",
  WELCOME:
    `👋 <b>Welcome to Banhammer Bot!</b>\n\n` +
    `<b>⚙️ Required Setup:</b>\n` +
    `Add me to your <b>Administrators</b> list\n` +
    `Grant me these permissions:\n` +
    `   - Delete messages\n` +
    `   - Ban users\n\n`,
  EDITED_LABEL: "\nEdited message",
} as const;

export const FALLBACK = {
  UNKNOWN_USER: "Unknown user",
  USER_ID_ONLY: "User ID {id} (no other identifier available)",
  UNKNOWN_CHAT: "Unknown chat",
  CHAT_ID_ONLY: "Chat ID {id}",
  UNKNOWN_REASON: "Unknown reason",
} as const;

export const REASON = {
  MIXED_ALPHABETS: "Message contains mixed alphabets in word {trigger} (character confusion attack)",
  SPAM_KEYWORD: "Message contains spam regex {trigger}",
  GREEK_SYMBOL: "Message contains Greek alphabet symbol in word {trigger}",
  KOREAN_CHARS: "Message contains {count} Korean characters (threshold: 15)",
  CHINESE_CHARS: "Message contains {count} Chinese characters",
  BANNED_CHANNEL: "Repost of malicious channel {trigger}",
  UNKNOWN: "Unknown reason: {trigger}",
} as const;

export const RULE = {
  BANNED_CHANNEL: "banned_channel_rule",
  MIXED: "mixed_rule",
  KEYWORD: "keyword_rule",
  GREEK: "greek_rule",
  KOREAN: "korean_rule",
  CHINESE: "chinese_rule",
  MANUAL_BAN: "manual_ban",
  TRIGGER_MANUAL_BAN: "manual_ban_by_admin",
} as const;
