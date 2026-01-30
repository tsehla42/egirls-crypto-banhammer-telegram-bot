import { Context } from "grammy";
import { type ValidationResult } from "../validators";
import { formatUserIdentifier } from "../utils";

export const replyAndLog = async (
    ctx: Context,
    validation: ValidationResult,
): Promise<void> => {
    const message = ctx.msg;
    const from = ctx.from;
    const userIdentifier = formatUserIdentifier(from);
    
    try {
        console.log(`[BANNED] ${userIdentifier} - Reason: ${validation.reason}`);
        await ctx.reply(
            `🖕 Banned user <b>${userIdentifier}</b> - Reason: <code>${validation.reason}</code>`,
            {
                reply_parameters: { message_id: message?.message_id! },
                parse_mode: "HTML",
            }
        );
    } catch (error) {
        console.error(`Failed to send reply message: ${error}`);
    }
}