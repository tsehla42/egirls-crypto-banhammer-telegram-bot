import { Context } from "grammy";
import { registerChat, deactivateChat } from "../services";

/**
 * Handles my_chat_member events to keep the chat registry up to date,
 * and sends a welcome message when the bot is first added to a group.
 * @param ctx - grammY context for a my_chat_member update
 */
export const handleBotChatMemberUpdate = async (ctx: Context): Promise<void> => {
  const chat = ctx.chat!;
  const oldStatus = ctx.myChatMember!.old_chat_member.status;
  const newStatus = ctx.myChatMember!.new_chat_member.status;

  const botAdded =
    (oldStatus === "left" || oldStatus === "kicked") &&
    (newStatus === "member" || newStatus === "administrator");

  const botRemoved =
    (oldStatus === "member" || oldStatus === "administrator") &&
    (newStatus === "left" || newStatus === "kicked");

  const botPromoted = oldStatus === "member" && newStatus === "administrator";

  if (botAdded) {
    registerChat(chat);

    try {
      await ctx.reply(
        `👋 <b>Welcome to Banhammer Bot!</b>\n\n` +
        `<b>⚙️ Required Setup:</b>\n` +
        `Add me to your <b>Administrators</b> list\n` +
        `Grant me these permissions:\n` +
        `   - Delete messages\n` +
        `   - Ban users\n\n` +
        {
          parse_mode: "HTML",
        }
      );
    } catch (error) {
      console.error(`[ChatMemberHandler] Failed to send welcome message: ${error}`);
    }
  } else if (botRemoved) {
    deactivateChat(chat.id);
  } else if (botPromoted) {
    registerChat(chat);
  }
};
