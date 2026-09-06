import { Context } from "grammy";
import { isAuthorizedForBan } from "./BanCommandHandler";
import { isBotAllowedToBan } from "../services/ChatPermissionService";
import { deleteMessage } from "../utils";
import { MSG } from "../strings";

const BAN_ID_PATTERNS = [
  /\(<code>(\d+)<\/code>\)/,
  /\((\d+)\)/,
];

function extractUserIdFromBanMessage(text: string): number | null {
  for (const pattern of BAN_ID_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const id = parseInt(match[1], 10);
      if (!isNaN(id) && id > 0) return id;
    }
  }
  return null;
}

async function resolveTargetUserId(ctx: Context): Promise<number | null> {
  const message = ctx.message;

  if (message?.reply_to_message) {
    const replyTo = message.reply_to_message;

    if (replyTo.from?.id !== ctx.me?.id) {
      try {
        await ctx.reply(MSG.UNBAN_NO_TARGET, { parse_mode: "HTML" });
      } catch {}
      return null;
    }

    const userId = extractUserIdFromBanMessage(replyTo.text || "");
    if (!userId) {
      try {
        await ctx.reply(MSG.UNBAN_NO_TARGET, { parse_mode: "HTML" });
      } catch {}
      return null;
    }

    return userId;
  }

  const parts = (message?.text || "").trim().split(/\s+/);
  const idArg = parts[1];

  if (!idArg) {
    try {
      await ctx.reply(MSG.UNBAN_NO_TARGET, { parse_mode: "HTML" });
    } catch (e: any) {
      console.error(`[UnbanCommand] Failed to send usage hint: ${e.message}`);
    }
    return null;
  }

  const parsedId = parseInt(idArg, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    try {
      await ctx.reply(MSG.UNBAN_NO_TARGET, { parse_mode: "HTML" });
    } catch {}
    return null;
  }

  return parsedId;
}

async function isUserBanned(ctx: Context, chatId: number, userId: number): Promise<boolean> {
  try {
    const member = await ctx.api.getChatMember(chatId, userId);
    return member.status === "kicked";
  } catch (error: any) {
    console.error(`[UnbanCommand] Failed to check ban status for user ${userId}: ${error.message}`);
    return true;
  }
}

async function performUnban(ctx: Context, chatId: number, userId: number): Promise<void> {
  try {
    await ctx.api.unbanChatMember(chatId, userId, { only_if_banned: true });
    console.log(`[UnbanCommand] Unbanned user ${userId} in chat ${chatId}`);
    try {
      await ctx.reply(MSG.UNBAN_SUCCESS.replace("{id}", String(userId)), { parse_mode: "HTML" });
    } catch {}
  } catch (error: any) {
    console.error(`[UnbanCommand] Failed to unban user ${userId}: ${error.message}`);
    try {
      await ctx.reply(MSG.UNBAN_FAILED.replace("{error}", error.message), { parse_mode: "HTML" });
    } catch {}
  }
}

export const handleUnbanCommand = async (ctx: Context): Promise<void> => {
  const chat = ctx.chat;
  const message = ctx.message;

  if (chat?.type !== "group" && chat?.type !== "supergroup") return;

  console.log(`[UnbanCommand] Called by ${ctx.from?.id} in chat ${chat?.id}, reply_to: ${message?.reply_to_message?.message_id ?? "none"}`);

  if (!(await isAuthorizedForBan(ctx))) {
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    return;
  }

  if (!(await isBotAllowedToBan(ctx, chat!.id))) {
    console.log(`[UnbanCommand] Bot not allowed to ban in ${chat!.id}`);
    try {
      await ctx.reply(MSG.UNBAN_NO_PERMISSION, { parse_mode: "HTML" });
    } catch {}
    return;
  }

  const userId = await resolveTargetUserId(ctx);
  if (!userId) return;

  if (!(await isUserBanned(ctx, chat!.id, userId))) {
    console.log(`[UnbanCommand] User ${userId} is not banned, skipping`);
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    return;
  }

  await performUnban(ctx, chat!.id, userId);
};
