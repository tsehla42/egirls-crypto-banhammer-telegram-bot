import { Context } from "grammy";

/**
 * Ban user and delete all their messages
 * @param ctx - grammY context
 * @param userId - ID of user to ban
 * @param reason - Reason for ban
 */
export const banUserAndDeleteMessages = async (
    ctx: Context,
    userId: number,
    reason: string
): Promise<void> => {
    const chat = ctx.chat;
    const api = ctx.api;

    if (!chat) {
        throw new Error("Chat information not available");
    }

    try {
        console.log(
            `[MODERATION] Banning user ${userId} with reason: "${reason}".`
        );

        await api.banChatMember(chat.id, userId, {
            revoke_messages: true,
        });
    } catch (error) {
        console.error(`Failed to ban user: ${error}`);
        throw error;
    }
};

