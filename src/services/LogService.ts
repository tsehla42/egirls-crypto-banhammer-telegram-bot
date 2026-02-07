import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { User, Chat } from "grammy/types";
import {
  formatValue,
  formatUsername,
  getChatUsername,
  getChatTitle,
} from "../utils";

const LOG_DIR = join(process.cwd(), "logs");

/**
 * Data required for logging a ban event
 */
export interface BanLogData {
  user: User;
  chat: Chat;
  ruleName: string;
  triggerWord: string;
}

/**
 * Ensure the logs directory exists
 */
const ensureLogDir = (): void => {
  if (!existsSync(LOG_DIR)) {
    try {
      mkdirSync(LOG_DIR, { recursive: true });
    } catch (error) {
      console.error(`[LogService] Failed to create log directory: ${error}`);
    }
  }
};

/**
 * Sanitize a string for use in a filename
 * Removes or replaces characters that are invalid in filenames
 */
const sanitizeForFilename = (value: string): string => {
  return value
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid filename characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .trim();
};

/**
 * Generate log file path for a specific chat
 * Format: chatname-chatusername-chatid.ban.log
 */
const getLogFilePath = (chat: Chat): string => {
  const chatTitle = sanitizeForFilename(getChatTitle(chat) || "unknown");
  const chatUsername = getChatUsername(chat) || "nousername";
  const chatId = chat.id;

  const filename = `${chatTitle}-${chatUsername}${chatId}.ban.log`;
  return join(LOG_DIR, filename);
};

/**
 * Log a ban event to the chat-specific log file
 * Format: timestamp firstName lastName @username userId ruleName triggerWord
 * Example: 2026-01-31T12:00:00.000Z John Doe @johndoe 12334567890 greek_rule σκύλος
 */
export const logBan = (data: BanLogData): void => {
  ensureLogDir();

  const timestamp = new Date().toISOString();
  const firstName = formatValue(data.user.first_name);
  const lastName = formatValue(data.user.last_name);
  const username = formatUsername(data.user.username);
  const userId = data.user.id;
  const ruleName = data.ruleName;
  const triggerWord = data.triggerWord;

  const logFile = getLogFilePath(data.chat);
  const logLine = `${timestamp} ${firstName} ${lastName} ${username} ${userId} ${ruleName} ${triggerWord}\n`;

  try {
    appendFileSync(logFile, logLine);
    console.log(`[LogService] Ban logged to ${logFile}: ${logLine.trim()}`);
  } catch (error) {
    console.error(`[LogService] Failed to write log: ${error}`);
  }
};
