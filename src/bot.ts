import { Bot, GrammyError, HttpError, type ErrorHandler } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";
import { API_KEY } from "./config";
import { handleBotChatMemberUpdate, handleBanCommand, handleMessage } from "./handlers";

const bot = new Bot(API_KEY as string);
bot.api.config.use(autoRetry());

const errorHandler: ErrorHandler = (err) => {
  const ctx = err.ctx;
  console.error(`[Bot] Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error(`[Bot] Telegram API error: ${e.description}`);
  } else if (e instanceof HttpError) {
    console.error(`[Bot] Network error: ${e}`);
  } else {
    console.error(`[Bot] Unknown error:`, e);
  }
};
bot.catch(errorHandler);

bot.command("ban", handleBanCommand);
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