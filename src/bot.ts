import { Bot, Context } from "grammy";
import { API_KEY, ID_VIOLATIONS_LOG_CHANNEL } from "./config";
import { validateMessage } from "./validators";
import {
  banUserAndDeleteMessages,
  replyToViolatingMessage,
  forwardViolatingMessage,
  handleBotChatMemberUpdate,
} from "./services";
import { debugLog } from "./utils";

const bot = new Bot(API_KEY as string);

bot.catch = (err) => {
  console.error("[Bot] Error in middleware:", err);
};

bot.on("my_chat_member", (ctx) => handleBotChatMemberUpdate(ctx));

bot.on("message", async (ctx: Context) => {
  const message = ctx.msg;
  const chat = ctx.chat;
  const from = ctx.from;

  debugLog(ctx);

  if (chat?.type === "group" || chat?.type === "supergroup") {
    // Skip processing for Telegram channel forwarding (user id 777000)
    // This is a special Telegram service account for channel messages
    if (from?.id === 777000) {
      return;
    }

    const validation = validateMessage(message?.text || "");

    if (!validation.isValid) {
      await replyToViolatingMessage(ctx, validation);
      await forwardViolatingMessage(ctx, ID_VIOLATIONS_LOG_CHANNEL);
      await banUserAndDeleteMessages(ctx, validation);

      return;
    }
  }
});

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