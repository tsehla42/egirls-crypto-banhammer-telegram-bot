import { Context } from "grammy";
import { ID_VIOLATIONS_LOG_CHANNEL, WHITELISTED_CHAT_IDS } from "../config";
import { validateMessage } from "../validators";
import {
  banUserAndDeleteMessages,
  replyToViolatingMessage,
  forwardViolatingMessage,
  isBotAllowedToBan,
  isUserAdmin,
  getLinkedChannelId,
} from "../services";
import { debugLog } from "../utils";

/**
 * Handles incoming and edited messages.
 * Validates message text/caption against all moderation rules and bans the user if violated.
 * @param ctx - grammY context
 * @param isEdit - Whether this was triggered by a message edit
 */
export const handleMessage = async (ctx: Context, isEdit = false): Promise<void> => {
  const message = ctx.msg;
  const chat = ctx.chat;
  const from = ctx.from;

  debugLog(ctx);

  const isGroupChat = chat?.type === "group" || chat?.type === "supergroup";
  const isWhitelisted = chat?.id !== undefined && WHITELISTED_CHAT_IDS.includes(chat.id);
  const isTelegramChannelForward = from?.id === 777000;
  const senderChatId = ctx.msg?.sender_chat?.id;
  const isAnonymousAdmin = senderChatId !== undefined && senderChatId === chat?.id;

  if (!isGroupChat) return;

  if (isWhitelisted) return;

  if (isTelegramChannelForward) return;

  if (isAnonymousAdmin) return;

  if (!(await isBotAllowedToBan(ctx, chat!.id))) return;

  if (from?.id && (await isUserAdmin(ctx, chat!.id, from.id))) return;

  // Channel_Bot (id 136817688) is the system sender Telegram uses when a user posts
  // as a channel. Only skip if sender_chat matches the group's actual linked channel.
  if (from?.id === 136817688 && senderChatId !== undefined) {
    const linkedChannelId = await getLinkedChannelId(ctx, chat!.id);
    if (linkedChannelId !== null && senderChatId === linkedChannelId) return;
  }

  const validation = validateMessage(message?.text || message?.caption || "");

  if (!validation.isValid) {
    validation.isEdit = isEdit;
    await replyToViolatingMessage(ctx, validation);
    await forwardViolatingMessage(ctx, ID_VIOLATIONS_LOG_CHANNEL);
    await banUserAndDeleteMessages(ctx, validation);
  }
};
