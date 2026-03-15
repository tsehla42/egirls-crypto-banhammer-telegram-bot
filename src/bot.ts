import { Bot } from "grammy";
import { API_KEY } from "./config";
import { handleBotChatMemberUpdate, handleMessage } from "./handlers";

const bot = new Bot(API_KEY as string);

bot.catch = (err) => {
  console.error("[Bot] Error in middleware:", err);
};

bot.on("my_chat_member", async (ctx) => await handleBotChatMemberUpdate(ctx));
bot.on("message", (ctx) => handleMessage(ctx));
bot.on("edited_message", (ctx) => handleMessage(ctx, true));

const startBot = async () => {
  try {
    console.log("[Bot] Starting bot...");
    const me = await bot.api.getMe();
    console.log(`[Bot] Bot is up and running as @${me.username}`);
    await bot.start();
  } catch (error) {
    console.error("[Bot] Failed to start bot:", error);
    process.exit(1);
  }
};

startBot();