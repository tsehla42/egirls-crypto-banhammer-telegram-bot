import { Context } from "grammy";

/**
 * Forward violating message to logging channel before deletion
 * Preserves all original message metadata including sender info, timestamp, etc.
 * @param ctx - grammY context
 * @param loggingChannelId - Chat ID of the logging channel
 */
export const forwardViolatingMessage = async (
  ctx: Context,
  loggingChannelId: number,
): Promise<void> => {
  const message = ctx.msg;
  const chat = ctx.chat;
  const from = ctx.from;

  if (!chat || !from || !message?.message_id) {
    console.warn("[ForwardingService] Missing chat, user, or message info");
    return;
  }

  try {
    const forwardedMsg = await ctx.api.forwardMessage(
      loggingChannelId,
      chat.id,
      message.message_id,
      {
        disable_notification: true,
      }
    );

    console.log(
      `[ForwardingService] Forwarded message ${message.message_id} from user ${from.id} to logging channel`
    );
  } catch (error: any) {
    console.error(
      `[ForwardingService] Failed to forward message ${message.message_id}: ${error.message}`
    );
  }
};
