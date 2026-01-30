import { Context } from "grammy";
import { type ValidationResult } from "../validators";

const formatUserIdentifier = (from?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    id: number;
}): string => {
    if (!from) {
        return "Unknown user";
    }

    const firstName = from.first_name?.trim();
    const lastName = from.last_name?.trim();

    // If we have first name or last name, use them
    if (firstName || lastName) {
        return [firstName, lastName].filter(Boolean).join(" ");
    }

    // If we have username, use it with @ prefix
    if (from.username) {
        return `@${from.username}`;
    }

    // Last resort: use user ID
    return `User ID ${from.id} (no other identifier available)`;
};

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