import type { User, Chat } from "grammy/types";
import type { ValidationResult } from "../validators";

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
    return "Unknown user";
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
  return `User ID ${from.id} (no other identifier available)`;
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
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Format ban reason for HTML output in Telegram
 * Replaces markdown backticks with HTML <code> tags
 */
export const formatBanReason = (validation: ValidationResult): string => {
  const { ruleName, triggerWord, reason } = validation;
  
  if (!reason) {
    return "Unknown reason";
  }

  // If we have the trigger word, format it properly with HTML
  if (triggerWord) {
    const escapedWord = escapeHtml(triggerWord);
    
    switch (ruleName) {
      case 'greek_rule':
        return `Message contains Greek alphabet symbol in word <code>${escapedWord}</code>`;
      case 'mixed_rule':
        return `Message contains mixed alphabets in word <code>${escapedWord}</code> (character confusion attack)`;
      default:
        // For other rules, just escape the reason and replace backticks
        return escapeHtml(reason).replace(/`([^`]+)`/g, '<code>$1</code>');
    }
  }

  // Fallback: escape HTML and convert markdown backticks to HTML code tags
  return escapeHtml(reason).replace(/`([^`]+)`/g, '<code>$1</code>');
};
