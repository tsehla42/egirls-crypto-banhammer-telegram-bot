import { Context } from "grammy";
import { WHITELISTED_CHAT_IDS } from "../config";
import { TELEGRAM_CHANNEL_BOT_ID, TELEGRAM_ANONYMOUS_CHANNEL_BOT_ID } from "../constants";
import { isBotAllowedToBan, isUserAdmin, getLinkedChannelId } from "./";

/**
 * Evaluates all pre-validation skip conditions for an incoming message.
 * Returns true if the message should be skipped (not validated/banned).
 */
export const shouldSkipMessage = async (ctx: Context): Promise<boolean> => {
  const chat = ctx.chat;
  const from = ctx.from;
  const senderChatId = ctx.msg?.sender_chat?.id;

  const isGroupChat = chat?.type === "group" || chat?.type === "supergroup";
  if (!isGroupChat) return true;

  const isWhitelisted = chat?.id !== undefined && WHITELISTED_CHAT_IDS.includes(chat.id);
  if (isWhitelisted) return true;

  const isTelegramChannelForward = from?.id === TELEGRAM_CHANNEL_BOT_ID;
  if (isTelegramChannelForward) return true;

  const isAnonymousAdmin = senderChatId !== undefined && senderChatId === chat?.id;
  if (isAnonymousAdmin) return true;

  const botCanBan = await isBotAllowedToBan(ctx, chat!.id);
  if (!botCanBan) return true;

  const senderIsAdmin = from?.id !== undefined && (await isUserAdmin(ctx, chat!.id, from.id));
  if (senderIsAdmin) return true;

  const isPostingAsChannel = from?.id === TELEGRAM_ANONYMOUS_CHANNEL_BOT_ID && senderChatId !== undefined;
  if (isPostingAsChannel) {
    const linkedChannelId = await getLinkedChannelId(ctx, chat!.id);
    if (linkedChannelId !== null && senderChatId === linkedChannelId) return true;
  }

  return false;
};
