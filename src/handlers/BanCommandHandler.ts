import { Context } from "grammy";
import { BOT_ADMIN_IDS, ID_VIOLATIONS_LOG_CHANNEL } from "../config";
import { TELEGRAM_CHANNEL_BOT_ID } from "../constants";
import { isUserAdmin, isBotAllowedToBan, getLinkedChannelId } from "../services/ChatPermissionService";
import { logBan } from "../services/LogService";
import {
  escapeHtml,
  formatUserIdentifier,
  deleteMessage,
  forwardMessageToChannel,
  resolveTargetFromReply,
  resolveTargetName,
  resolveLogUser,
  isKnownBanFailure,
  parseBanFlags,
} from "../utils";

/**
 * Check if the sender is authorized to use the /ban command.
 * Authorized if: bot admin (user or channel ID in BOT_ADMIN_IDS) OR chat admin.
 */
export const isAuthorizedForBan = async (ctx: Context): Promise<boolean> => {
  const chat = ctx.chat;
  const from = ctx.from;
  const senderChat = ctx.senderChat;

  if (!chat || !from) return false;

  const isBotAdminByUser = BOT_ADMIN_IDS.includes(from.id);
  const isBotAdminByChannel = senderChat && BOT_ADMIN_IDS.includes(senderChat.id);
  const isChatAdmin = await isUserAdmin(ctx, chat.id, from.id);

  return isBotAdminByUser || isBotAdminByChannel || isChatAdmin;
};

/**
 * Check if the target should be excluded from banning.
 * Returns true if the target is protected (owner, admin, linked channel, etc.)
 */
const isExcludedTarget = async (ctx: Context, targetId: number, chatId: number): Promise<boolean> => {
  const isTelegramChannelBot = targetId === TELEGRAM_CHANNEL_BOT_ID;
  const isChatAdmin = await isUserAdmin(ctx, chatId, targetId);

  const linkedChannelId = await getLinkedChannelId(ctx, chatId);
  const isLinkedChannel = linkedChannelId !== null && targetId === linkedChannelId;

  return isTelegramChannelBot || isChatAdmin || isLinkedChannel;
};

/**
 * Get the admin's display name for the ban reason.
 * Uses channel title if posting as channel, otherwise user's name.
 */
const getAdminName = (ctx: Context): string => {
  if (ctx.senderChat?.title) {
    return ctx.senderChat.title;
  }
  return formatUserIdentifier(ctx.from);
};

/**
 * Handle /ban command. Must be a reply to a message.
 * Bans the target user, deletes both messages, replies with confirmation.
 * Use /ban s or /ban silent for silent mode (no confirmation reply).
 */
export const handleBanCommand = async (ctx: Context): Promise<void> => {
  const chat = ctx.chat;
  const message = ctx.message;

  const isGroupChat = chat?.type === "group" || chat?.type === "supergroup";
  if (!isGroupChat) return;

  const isReplyToMessage = !!message?.reply_to_message;
  if (!isReplyToMessage) return;

  const isAuthorized = await isAuthorizedForBan(ctx);
  if (!isAuthorized) {
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    return;
  }

  const botCanBan = await isBotAllowedToBan(ctx, chat!.id);
  if (!botCanBan) {
    try {
      await ctx.reply("I don't have permission to ban users in this chat.");
    } catch {}
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    return;
  }

  const replyTo = message!.reply_to_message!;
  const targetUser = resolveTargetFromReply(replyTo);

  if (!targetUser) {
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    return;
  }

  const targetId = targetUser.id;

  const isTargetGroup = replyTo.sender_chat?.id === chat!.id || replyTo.from?.id === chat!.id;
  if (isTargetGroup) {
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    return;
  }

  const excluded = await isExcludedTarget(ctx, targetId, chat!.id);
  if (excluded) {
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    return;
  }

  const { silent } = parseBanFlags(message!.text || "");
  const targetName = resolveTargetName(replyTo);
  const adminName = getAdminName(ctx);

  try {
    await ctx.api.banChatMember(chat!.id, targetId);
    console.log(`[BanCommand] Banned user ${targetId} (${targetName}) in chat ${chat!.id}`);

    await deleteMessage(ctx.api, chat!.id, message!.message_id);
    await deleteMessage(ctx.api, chat!.id, replyTo.message_id);

    if (!silent) {
      await ctx.reply(
        `🖕 Banned user <b>${escapeHtml(targetName)}</b>\nReason: manual ban by ${escapeHtml(adminName)}`,
        { parse_mode: "HTML" }
      );
    }

    await forwardMessageToChannel(
      ctx.api,
      ID_VIOLATIONS_LOG_CHANNEL,
      chat!.id,
      replyTo.message_id
    );

    logBan({
      user: resolveLogUser(replyTo, targetId),
      chat: chat!,
      ruleName: "manual_ban",
      triggerWord: "manual_ban_by_admin",
    });

  } catch (error: any) {
    console.error(`[BanCommand] Failed to ban user ${targetId}: ${error.message}`);
    if (!isKnownBanFailure(error)) {
      try {
        await ctx.reply(`Failed to ban user: ${error.message}`);
      } catch {}
    }
    await deleteMessage(ctx.api, chat!.id, message!.message_id);
  }
};
