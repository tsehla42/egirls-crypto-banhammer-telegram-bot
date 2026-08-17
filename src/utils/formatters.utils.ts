import type { User, Chat } from "grammy/types";
import type { ValidationResult } from "../validators";
import { FALLBACK, REASON } from "../strings";

/**
 * Format a value for output, using "-" for missing values
 */
export const formatValue = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  return String(value);
};

/**
 * Format username with @ prefix, or "-" if not available
 */
export const formatUsername = (username: string | undefined): string => {
  if (!username) {
    return "-";
  }
  return `@${username}`;
};

/**
 * Get a human-readable user identifier from User object
 * Prefers name > username > user ID
 */
export const formatUserIdentifier = (from?: User): string => {
  if (!from) {
    return FALLBACK.UNKNOWN_USER;
  }

  const firstName = from.first_name?.trim();
  const lastName = from.last_name?.trim();

  // If we have first name or last name, use them
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  // If we have username, use it with @ prefix
  if (from.username) {
    return `@${from.username}`;
  }

  // Last resort: use user ID
  return FALLBACK.USER_ID_ONLY.replace("{id}", String(from.id));
};

export const formatChatIdentifier = (chat?: Chat): string => {
  if (!chat) {
    return FALLBACK.UNKNOWN_CHAT;
  }

  if ("title" in chat && chat.title) {
    return chat.title;
  }

  if ("username" in chat && chat.username) {
    return `@${chat.username}`;
  }

  return FALLBACK.CHAT_ID_ONLY.replace("{id}", String(chat.id));
};

/**
 * Get chat username from Chat object
 * Chat username is available on supergroups and channels
 */
export const getChatUsername = (chat: Chat): string | undefined => {
  if ("username" in chat) {
    return chat.username;
  }
  return undefined;
};

/**
 * Get chat title from Chat object
 */
export const getChatTitle = (chat: Chat): string | undefined => {
  if ("title" in chat) {
    return chat.title;
  }
  return undefined;
};

/**
 * Escape HTML special characters to prevent injection
 */
export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const buildBanReason = (validation: ValidationResult, wrap: (word: string) => string): string => {
  const { ruleName, triggerWord } = validation;

  if (!triggerWord) {
    return FALLBACK.UNKNOWN_REASON;
  }

  switch (ruleName) {
    case 'mixed_rule':
      return REASON.MIXED_ALPHABETS.replace("{trigger}", wrap(triggerWord));
    case 'keyword_rule':
      return REASON.SPAM_KEYWORD.replace("{trigger}", wrap(triggerWord));
    case 'greek_rule':
      return REASON.GREEK_SYMBOL.replace("{trigger}", wrap(triggerWord));
    case 'korean_rule': {
      const count = triggerWord.split('_')[0];
      return REASON.KOREAN_CHARS.replace("{count}", count);
    }
    case 'chinese_rule': {
      const count = triggerWord.split('_')[0];
      return REASON.CHINESE_CHARS.replace("{count}", count);
    }
    case 'banned_channel_rule':
      return REASON.BANNED_CHANNEL.replace("{trigger}", wrap(triggerWord));
    default:
      return REASON.UNKNOWN.replace("{trigger}", wrap(triggerWord));
  }
};

export const formatBanReason = (validation: ValidationResult): string =>
  buildBanReason(validation, (word) => `<code>${escapeHtml(word)}</code>`);

export const formatBanReasonPlain = (validation: ValidationResult): string =>
  buildBanReason(validation, (word) => `"${word}"`);
