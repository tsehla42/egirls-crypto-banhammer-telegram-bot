import { Context } from "grammy";

/**
 * Ban user and delete their violating message
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
    const message = ctx.msg;
    const api = ctx.api;

    if (!chat) {
        throw new Error("Chat information not available");
    }

    try {
        console.log(
            `[BanService] Banning user ${userId} with reason: "${reason}".`
        );

        if (message?.message_id) {
            try {
                await api.deleteMessage(chat.id, message.message_id);
                console.log(`[BanService] Deleted violating message ${message.message_id}`);
            } catch (deleteError) {
                console.error(`Failed to delete message: ${deleteError}`);
            }
        }

        await api.banChatMember(chat.id, userId);
        console.log(`[BanService] User ${userId} banned from chat`);
    } catch (error) {
        console.error(`Failed to ban user: ${error}`);
        throw error;
    }
};

