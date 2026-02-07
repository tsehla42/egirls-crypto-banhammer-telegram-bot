import { Context } from "grammy";
import { type ValidationResult } from "../validators";
import { formatUserIdentifier, formatBanReason } from "../utils";

export const replyToViolatingMessage = async (
  ctx: Context,
  validation: ValidationResult,
): Promise<void> => {
  const message = ctx.msg;
  const from = ctx.from;
  const userIdentifier = formatUserIdentifier(from);
  const formattedReason = formatBanReason(validation);

  try {
    await ctx.reply(
      `🖕 Banned user <b>${userIdentifier}</b>\nReason: ${formattedReason}`,
      {
        reply_parameters: { message_id: message?.message_id! },
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error(`[ReplyService] Failed to send reply message: ${error}`);
  }
}