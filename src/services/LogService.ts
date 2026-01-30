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
const LOG_FILE = join(LOG_DIR, "bans.ban.log");

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
    mkdirSync(LOG_DIR, { recursive: true });
  }
};

/**
 * Log a ban event to the log file
 * Format: firstName lastName @username oduserId ruleName triggerWord chatTitle @chatUsername chatId
 * Example: John Doe @johndoe 12334567890 greek_rule σκύλος ChatName @chatname -154314132131
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
  const chatTitle = formatValue(getChatTitle(data.chat));
  const chatUsername = formatUsername(getChatUsername(data.chat));
  const chatId = data.chat.id;

  const logLine = `${timestamp} ${firstName} ${lastName} ${username} ${userId} ${ruleName} ${triggerWord} ${chatTitle} ${chatUsername} ${chatId}\n`;

  try {
    appendFileSync(LOG_FILE, logLine);
    console.log(`[LogService] Ban logged: ${logLine.trim()}`);
  } catch (error) {
    console.error(`[LogService] Failed to write log: ${error}`);
  }
};
