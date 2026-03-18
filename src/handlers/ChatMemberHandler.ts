import { Context } from "grammy";
import { registerChat, deactivateChat, updateBotPermissionCache } from "../services";

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

  const botAdminStatusChanged =
    (oldStatus === "member" && newStatus === "administrator") ||
    (oldStatus === "administrator" && newStatus === "administrator");

  const getBotBanPermissionFromUpdate = (): boolean => {
    const newMember = ctx.myChatMember!.new_chat_member;
    return newMember.status === "administrator" && newMember.can_restrict_members === true;
  };

  if (botAdded) {
    registerChat(chat);
    updateBotPermissionCache(chat.id, getBotBanPermissionFromUpdate());

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
    updateBotPermissionCache(chat.id, false);
  } else if (botAdminStatusChanged) {
    registerChat(chat);
    updateBotPermissionCache(chat.id, getBotBanPermissionFromUpdate());
  }
};
