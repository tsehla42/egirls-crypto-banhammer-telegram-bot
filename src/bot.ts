import { Bot, Context } from "grammy";
import { API_KEY } from "./config";
import { log } from "console";

const bot = new Bot(API_KEY as string);

// Handle all messages in group chats
bot.on("message", async (ctx: Context) => {
    // Get message and chat information
    const message = ctx.msg;
    const chat = ctx.chat;
    const from = ctx.from;

    console.log({
        chatType: chat?.type,
        chatId: chat?.id,
        chatTitle: chat?.title,
        userId: from?.id,
        userUsername: from?.username,
        userName: from?.first_name,
        messageText: message?.text,
        messageId: message?.message_id,
    });

    // Only process moderation for group chats
    if (chat?.type === "group" || chat?.type === "supergroup") {
        // TODO: Add moderation rules here
    }
});

const startBot = async () => {
    try {
        console.log("Starting bot...");
        const me = await bot.api.getMe();
        console.log(`Bot is up and running as @${me.username}`);
        await bot.start();
    } catch (error) {
        console.error("Failed to start bot:", error);
        process.exit(1);
    }
};

startBot();