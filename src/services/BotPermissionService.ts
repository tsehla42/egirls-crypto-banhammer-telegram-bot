import { Context } from "grammy";

/**
 * Cache bot ban permission per chat to avoid an API call on every message.
 */
const permissionCache = new Map<number, { canBan: boolean; cachedAt: number }>();
const CACHE_TTL_MS = 25 * 60 * 1000; // 25 minutes

export const updateBotPermissionCache = (chatId: number, canBan: boolean): void => {
  permissionCache.set(chatId, { canBan, cachedAt: Date.now() });
};

/**
 * Returns true only if the bot is an administrator with `can_restrict_members`.
 */
export const isBotAllowedToBan = async (ctx: Context, chatId: number): Promise<boolean> => {
  const now = Date.now();
  const cached = permissionCache.get(chatId);

  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.canBan;
  }

  try {
    const member = await ctx.api.getChatMember(chatId, ctx.me.id);
    const canBan =
      member.status === "administrator" && member.can_restrict_members === true;
    permissionCache.set(chatId, { canBan, cachedAt: now });
    return canBan;
  } catch {
    return false;
  }
};
