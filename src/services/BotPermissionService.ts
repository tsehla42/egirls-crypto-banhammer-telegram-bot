import { Context } from "grammy";

/**
 * Cache bot ban permission per chat to avoid an API call on every message.
 */
const permissionCache = new Map<number, { canBan: boolean; cachedAt: number }>();
const CACHE_TTL_MS = 25 * 60 * 1000; // 25 minutes

/**
 * Cache user admin status per chat:user pair to avoid an API call on every message.
 */
const adminCache = new Map<string, { isAdmin: boolean; cachedAt: number }>();
const ADMIN_CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

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

/**
 * Returns true if the given user is an administrator or the creator of the chat.
 * Results are cached per chat+user for 8 hours.
 */
export const isUserAdmin = async (ctx: Context, chatId: number, userId: number): Promise<boolean> => {
  const key = `${chatId}:${userId}`;
  const now = Date.now();
  const cached = adminCache.get(key);

  if (cached && now - cached.cachedAt < ADMIN_CACHE_TTL_MS) {
    return cached.isAdmin;
  }

  try {
    const member = await ctx.api.getChatMember(chatId, userId);
    const isAdmin = member.status === "administrator" || member.status === "creator";
    adminCache.set(key, { isAdmin, cachedAt: now });
    return isAdmin;
  } catch {
    return false;
  }
};
