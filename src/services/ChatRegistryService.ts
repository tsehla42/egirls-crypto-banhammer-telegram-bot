import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Chat } from "grammy/types";

const REGISTRY_FILE = join(process.cwd(), "data", "chat-registry.json");

export interface ChatInfo {
  chatId: number;
  title: string;
  username?: string;
  type: "group" | "supergroup" | "channel";
  addedAt: string;
  isActive: boolean;
}

interface ChatRegistry {
  chats: ChatInfo[];
  lastUpdated: string;
}

const ensureDataDir = (): void => {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    try {
      const { mkdirSync } = require("fs");
      mkdirSync(dataDir, { recursive: true });
    } catch (error) {
      console.error(`[ChatRegistry] Failed to create data directory: ${error}`);
    }
  }
};

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

const saveRegistry = (registry: ChatRegistry): void => {
  ensureDataDir();

  try {
    registry.lastUpdated = new Date().toISOString();
    writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  } catch (error) {
    console.error(`[ChatRegistry] Failed to save registry: ${error}`);
  }
};

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

export const deactivateChat = (chatId: number): void => {
  const registry = loadRegistry();
  const existingIndex = registry.chats.findIndex(c => c.chatId === chatId);

  if (existingIndex >= 0) {
    registry.chats[existingIndex].isActive = false;
    console.log(`[ChatRegistry] Deactivated chat: ${registry.chats[existingIndex].title} (${chatId})`);
    saveRegistry(registry);
  }
};

export const getActiveChatIds = (): number[] => {
  const registry = loadRegistry();
  return registry.chats
    .filter(c => c.isActive)
    .map(c => c.chatId);
};

export const getActiveChats = (): ChatInfo[] => {
  const registry = loadRegistry();
  return registry.chats.filter(c => c.isActive);
};

export const getAllChats = (): ChatInfo[] => {
  const registry = loadRegistry();
  return registry.chats;
};

export const getRegistryPath = (): string => {
  return REGISTRY_FILE;
};

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
