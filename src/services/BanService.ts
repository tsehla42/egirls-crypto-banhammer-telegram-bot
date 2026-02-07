import { Context } from "grammy";
import { logBan } from "./LogService";
import { type ValidationResult } from "../validators";

/**
 * Ban user, delete their violating message, and log the event
 * @param ctx - grammY context
 * @param validation - Validation result with ban reason and trigger info
 */
export const banUserAndDeleteMessages = async (
  ctx: Context,
  validation: ValidationResult
): Promise<void> => {
  const chat = ctx.chat;
  const message = ctx.msg;
  const from = ctx.from;
  const api = ctx.api;

  if (!chat || !from) {
    console.error("[BanService] Chat or user information not available");
    return;
  }

  try {
    console.log(
      `[BanService] Banning user ${from.id} with reason: "${validation.reason}".`
    );

    if (message?.message_id) {
      try {
        await api.deleteMessage(chat.id, message.message_id);
        console.log(`[BanService] Deleted violating message ${message.message_id}`);
      } catch (deleteError: any) {
        console.error(`[BanService] Failed to delete message: ${deleteError}`);
      }
    }

    try {
      await api.banChatMember(chat.id, from.id);
      console.log(`[BanService] User ${from.id} banned from chat`);
    } catch (banError: any) {
      console.error(`[BanService] Failed to ban user: ${banError}`);
      return;
    }

    // Log the ban event
    if (validation.ruleName && validation.triggerWord) {
      logBan({
        user: from,
        chat: chat,
        ruleName: validation.ruleName,
        triggerWord: validation.triggerWord,
      });
    }
  } catch (error) {
    console.error(`[BanService] Unexpected error: ${error}`);
  }
};

