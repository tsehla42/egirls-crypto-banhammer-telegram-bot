import { Context } from "grammy";
import { type ValidationResult } from "../validators";
import { formatUserIdentifier, formatBanReason } from "../utils";
import { MSG } from "../strings";

export const replyToViolatingMessage = async (
  ctx: Context,
  validation: ValidationResult,
): Promise<void> => {
  const message = ctx.msg;
  const from = ctx.from;
  const userIdentifier = formatUserIdentifier(from);
  const formattedReason = formatBanReason(validation);

  try {
    const editLabel = validation.isEdit ? MSG.EDITED_LABEL : "";
    await ctx.reply(
      MSG.BAN_CONFIRMATION
        .replace("{name}", userIdentifier) +
      `${editLabel}\nReason: ${formattedReason}`,
      {
        reply_parameters: { message_id: message?.message_id! },
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error(`[ReplyService] Failed to send reply message: ${error}`);
  }
}