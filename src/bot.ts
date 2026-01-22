import { Bot, Context } from "grammy";
import { API_KEY } from "./config";
import { validateMessage } from "./validators";
import { banUserAndDeleteMessages } from "./services/BanService";
import { replyAndLog } from "./services/ReplyService";

const bot = new Bot(API_KEY as string);

bot.on("message", async (ctx: Context) => {
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

  if (chat?.type === "group" || chat?.type === "supergroup") {
    const validation = validateMessage(message?.text || "");

    if (!validation.isValid) {
      await replyAndLog(ctx, validation);

      try {
        await banUserAndDeleteMessages(ctx, from?.id!, validation.reason!);
      } catch (error) {
        console.error(`Failed to execute ban: ${error}`);
      }

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