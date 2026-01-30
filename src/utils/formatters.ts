import type { User, Chat } from "grammy/types";

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
