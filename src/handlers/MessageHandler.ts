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

  const text = message?.text || message?.caption || "";
  const senderId = message?.sender_chat?.id
    ?? (message?.forward_origin as any)?.chat?.id;
  const validation = validateMessage(text, senderId);

  if (!validation.isValid) {
    validation.isEdit = isEdit;

    // Reply and forward are independent — run in parallel
    await Promise.all([
      replyToViolatingMessage(ctx, validation),
      forwardViolatingMessage(ctx, ID_VIOLATIONS_LOG_CHANNEL),
    ]);

    // Ban+delete must happen after forward (message needs to exist for forwarding)
    await banUserAndDeleteMessages(ctx, validation);
  }
};
