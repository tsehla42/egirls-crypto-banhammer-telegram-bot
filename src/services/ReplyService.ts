import { Context } from "grammy";
import { type ValidationResult } from "../validators";

export const replyAndLog = async (
    ctx: Context,
    validation: ValidationResult,
): Promise<void> => {
    const message = ctx.msg;
    const from = ctx.from;
    try {
        console.log(`[BANNED] ${from?.username} - Reason: ${validation.reason}`);
        await ctx.reply(`🖕 Banned user ${from?.username} - Reason: ${validation.reason}`, {
            reply_parameters: { message_id: message?.message_id! },
        });
    } catch (error) {
        console.error(`Failed to send reply message: ${error}`);
    }
}