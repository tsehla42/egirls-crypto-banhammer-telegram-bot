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

/**
 * Cache linked channel ID per group. 240 hours TTL — changes almost never.
 */
const linkedChannelCache = new Map<number, { linkedChatId: number | null; cachedAt: number }>();
const LINKED_CHANNEL_CACHE_TTL_MS = 240 * 60 * 60 * 1000; // 240 hours


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

/**
 * Returns the linked channel ID for the given supergroup, or null if none.
 * Only called when a message is sent via Channel_Bot (from.id === 136817688).
 */
export const getLinkedChannelId = async (ctx: Context, chatId: number): Promise<number | null> => {
  const now = Date.now();
  const cached = linkedChannelCache.get(chatId);

  if (cached && now - cached.cachedAt < LINKED_CHANNEL_CACHE_TTL_MS) {
    return cached.linkedChatId;
  }

  console.log(`[LinkedChannel] Fetching linked_chat_id for chat ${chatId} via getChat()`);

  try {
    const chat = await ctx.api.getChat(chatId);
    const linkedChatId = ("linked_chat_id" in chat ? chat.linked_chat_id : undefined) ?? null;
    linkedChannelCache.set(chatId, { linkedChatId, cachedAt: now });
    return linkedChatId;
  } catch {
    return null;
  }
};
