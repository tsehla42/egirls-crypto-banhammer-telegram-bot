import { Context } from "grammy";

export const debugLog = (ctx: Context): void => {
  if (process.env.NODE_ENV !== "production") {
    const chat = ctx.chat;
    const from = ctx.from;
    const message = ctx.message;
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
}