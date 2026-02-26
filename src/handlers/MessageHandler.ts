import { Context } from "grammy";
import { ID_VIOLATIONS_LOG_CHANNEL } from "../config";
import { validateMessage } from "../validators";
import {
  banUserAndDeleteMessages,
  replyToViolatingMessage,
  forwardViolatingMessage,
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

  if (chat?.type !== "group" && chat?.type !== "supergroup") {
    return;
  }

  // Skip processing for Telegram channel forwarding (user id 777000)
  // This is a special Telegram service account for channel messages
  if (from?.id === 777000) {
    return;
  }

  const validation = validateMessage(message?.text || message?.caption || "");

  if (!validation.isValid) {
    validation.isEdit = isEdit;
    await replyToViolatingMessage(ctx, validation);
    await forwardViolatingMessage(ctx, ID_VIOLATIONS_LOG_CHANNEL);
    await banUserAndDeleteMessages(ctx, validation);
  }
};
