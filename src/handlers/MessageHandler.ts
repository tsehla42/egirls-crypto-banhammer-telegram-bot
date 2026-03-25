import { Context } from "grammy";
import { ID_VIOLATIONS_LOG_CHANNEL } from "../config";
import { validateMessage } from "../validators";
import {
  banUserAndDeleteMessages,
  replyToViolatingMessage,
  forwardViolatingMessage,
  shouldSkipMessage,
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

  debugLog(ctx);

  if (await shouldSkipMessage(ctx)) return;

  const validation = validateMessage(message?.text || message?.caption || "");

  if (!validation.isValid) {
    validation.isEdit = isEdit;
    await replyToViolatingMessage(ctx, validation);
    await forwardViolatingMessage(ctx, ID_VIOLATIONS_LOG_CHANNEL);
    await banUserAndDeleteMessages(ctx, validation);
  }
};
