import { Bot, Context } from "grammy";
import { API_KEY } from "./config";
import { validateMessage } from "./validators";
import { banUserAndDeleteMessages } from "./services/BanService";
import { replyAndLog } from "./services/ReplyService";
import { handleBotChatMemberUpdate } from "./services/ChatRegistryService";

const bot = new Bot(API_KEY as string);

bot.on("my_chat_member", (ctx) => handleBotChatMemberUpdate(ctx));

bot.on("message", async (ctx: Context) => {
  const message = ctx.msg;
  const chat = ctx.chat;
  const from = ctx.from;

  if (process.env.NODE_ENV !== "production") {
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
  }

  if (chat?.type === "group" || chat?.type === "supergroup") {
    // Skip processing for Telegram channel forwarding (user id 777000)
    // This is a special Telegram service account for channel messages
    if (from?.id === 777000) {
      return;
    }

    const validation = validateMessage(message?.text || "");

    if (!validation.isValid) {
      await replyAndLog(ctx, validation);
      await banUserAndDeleteMessages(ctx, validation);

      return;
    }
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