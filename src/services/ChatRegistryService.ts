import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Chat } from "grammy/types";

const REGISTRY_FILE = join(process.cwd(), "data", "chat-registry.json");

/**
 * Chat information stored in the registry
 */
export interface ChatInfo {
    chatId: number;
    title: string;
    username?: string;
    type: "group" | "supergroup" | "channel";
    addedAt: string;
    isActive: boolean;
}

/**
 * Chat registry data structure
 */
interface ChatRegistry {
    chats: ChatInfo[];
    lastUpdated: string;
}

/**
 * Ensure the data directory exists
 */
const ensureDataDir = (): void => {
    const dataDir = join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
        const { mkdirSync } = require("fs");
        mkdirSync(dataDir, { recursive: true });
    }
};

/**
 * Load the chat registry from file
 */
const loadRegistry = (): ChatRegistry => {
    ensureDataDir();
    
    if (!existsSync(REGISTRY_FILE)) {
        return { chats: [], lastUpdated: new Date().toISOString() };
    }

    try {
        const data = readFileSync(REGISTRY_FILE, "utf-8");
        return JSON.parse(data) as ChatRegistry;
    } catch (error) {
        console.error(`[ChatRegistry] Failed to load registry: ${error}`);
        return { chats: [], lastUpdated: new Date().toISOString() };
    }
};

/**
 * Save the chat registry to file
 */
const saveRegistry = (registry: ChatRegistry): void => {
    ensureDataDir();
    
    try {
        registry.lastUpdated = new Date().toISOString();
        writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
    } catch (error) {
        console.error(`[ChatRegistry] Failed to save registry: ${error}`);
    }
};

/**
 * Add or update a chat in the registry
 */
export const registerChat = (chat: Chat): void => {
    if (chat.type !== "group" && chat.type !== "supergroup" && chat.type !== "channel") {
        return; // Only track group chats and channels
    }

    const registry = loadRegistry();
    const existingIndex = registry.chats.findIndex(c => c.chatId === chat.id);

    const chatInfo: ChatInfo = {
        chatId: chat.id,
        title: "title" in chat && chat.title ? chat.title : `Chat ${chat.id}`,
        username: "username" in chat ? chat.username : undefined,
        type: chat.type,
        addedAt: existingIndex >= 0 ? registry.chats[existingIndex].addedAt : new Date().toISOString(),
        isActive: true,
    };

    if (existingIndex >= 0) {
        registry.chats[existingIndex] = chatInfo;
        console.log(`[ChatRegistry] Updated chat: ${chatInfo.title} (${chatInfo.chatId})`);
    } else {
        registry.chats.push(chatInfo);
        console.log(`[ChatRegistry] Registered new chat: ${chatInfo.title} (${chatInfo.chatId})`);
    }

    saveRegistry(registry);
};

/**
 * Mark a chat as inactive (bot was removed)
 */
export const deactivateChat = (chatId: number): void => {
    const registry = loadRegistry();
    const existingIndex = registry.chats.findIndex(c => c.chatId === chatId);

    if (existingIndex >= 0) {
        registry.chats[existingIndex].isActive = false;
        console.log(`[ChatRegistry] Deactivated chat: ${registry.chats[existingIndex].title} (${chatId})`);
        saveRegistry(registry);
    }
};

/**
 * Get all active chat IDs
 */
export const getActiveChatIds = (): number[] => {
    const registry = loadRegistry();
    return registry.chats
        .filter(c => c.isActive)
        .map(c => c.chatId);
};

/**
 * Get all active chats
 */
export const getActiveChats = (): ChatInfo[] => {
    const registry = loadRegistry();
    return registry.chats.filter(c => c.isActive);
};

/**
 * Get all chats (including inactive)
 */
export const getAllChats = (): ChatInfo[] => {
    const registry = loadRegistry();
    return registry.chats;
};

/**
 * Get the path to the registry file
 */
export const getRegistryPath = (): string => {
    return REGISTRY_FILE;
};

/**
 * Handle my_chat_member update - tracks when bot is added/removed from chats
 * @param ctx - The context from my_chat_member event containing chat and member status info
 */
export const handleBotChatMemberUpdate = (ctx: {
    chat: Chat;
    myChatMember: {
        old_chat_member: { status: string };
        new_chat_member: { status: string };
    };
}): void => {
    const { chat } = ctx;
    const oldStatus = ctx.myChatMember.old_chat_member.status;
    const newStatus = ctx.myChatMember.new_chat_member.status;

    // Bot was added to a chat
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
