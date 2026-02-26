import { Context } from "grammy";
import { registerChat, deactivateChat } from "../services";

/**
 * Handles my_chat_member events to keep the chat registry up to date.
 * Registers the chat when the bot is added/promoted, deactivates it when removed.
 * @param ctx - grammY context for a my_chat_member update
 */
export const handleBotChatMemberUpdate = (ctx: Context): void => {
  const chat = ctx.chat!;
  const oldStatus = ctx.myChatMember!.old_chat_member.status;
  const newStatus = ctx.myChatMember!.new_chat_member.status;

  // Bot was added to a chat or promoted to admin
  if (
    (oldStatus === "left" || oldStatus === "kicked") &&
    (newStatus === "member" || newStatus === "administrator")
  ) {
    registerChat(chat);
  }
  // Bot was removed from a chat
  else if (
    (oldStatus === "member" || oldStatus === "administrator") &&
    (newStatus === "left" || newStatus === "kicked")
  ) {
    deactivateChat(chat.id);
  }
  // Bot was promoted to admin (update chat info)
  else if (oldStatus === "member" && newStatus === "administrator") {
    registerChat(chat);
  }
};
