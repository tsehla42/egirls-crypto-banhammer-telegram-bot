import type { User, Chat, Message } from "grammy/types";
import type { Api } from "grammy";
import { formatUserIdentifier, formatChatIdentifier } from "./formatters.utils";

/**
 * Delete a message, logging errors.
 */
export const deleteMessage = async (
  api: Api,
  chatId: number,
  messageId: number
): Promise<void> => {
  try {
    await api.deleteMessage(chatId, messageId);
  } catch (error: any) {
    console.error(`[BanCommand] Failed to delete message ${messageId} in chat ${chatId}: ${error.message}`);
  }
};

/**
 * Forward a message to a channel, ignoring errors.
 */
export const forwardMessageToChannel = async (
  api: Api,
  targetChannelId: number,
  sourceChatId: number,
  messageId: number
): Promise<void> => {
  try {
    await api.forwardMessage(targetChannelId, sourceChatId, messageId, {
      disable_notification: true,
    });
  } catch (error: any) {
    console.error(`[BanCommand] Failed to forward message ${messageId} from chat ${sourceChatId}: ${error.message}`);
  }
};

/**
 * Resolve the target user from a reply_to_message.
 * Returns the user or chat that posted the message.
 */
export const resolveTargetFromReply = (
  replyTo: Message
): User | Chat | undefined => {
  return replyTo.from || replyTo.sender_chat;
};

/**
 * Resolve the target's display name from a reply_to_message.
 */
export const resolveTargetName = (replyTo: Message): string => {
  return replyTo.from
    ? formatUserIdentifier(replyTo.from)
    : formatChatIdentifier(replyTo.sender_chat);
};

/**
 * Resolve the user object for logging from a reply_to_message.
 * Falls back to a synthetic User-like object if only a chat is available.
 */
export const resolveLogUser = (replyTo: Message, targetId: number): User => {
  if (replyTo.from) return replyTo.from;
  return {
    id: targetId,
    first_name: replyTo.sender_chat?.title || "Unknown",
    is_bot: false,
  } as User;
};

/**
 * Check if a ban error is a known Telegram limitation
 * (bot, owner, admin, etc.) that should be silently ignored.
 */
export const isKnownBanFailure = (error: any): boolean => {
  const message = error?.message || "";
  return (
    message.includes("can't restrict self") ||
    message.includes("can't remove chat owner") ||
    message.includes("user is an administrator")
  );
};

/**
 * Parse ban command text for flags.
 * Returns { silent: true } if "/ban s" or "/ban silent" is used.
 */
export const parseBanFlags = (text: string): { silent: boolean } => {
  const parts = text.trim().split(/\s+/);
  const flag = parts[1]?.toLowerCase();
  return {
    silent: flag === "s" || flag === "silent",
  };
};
