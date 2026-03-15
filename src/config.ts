import { config as loadEnv } from "dotenv";
import env from "env-var";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

export const API_KEY = env.get("API_KEY").required().asString();
export const TEST_USER_ID = env.get("TEST_USER_ID").required().asIntPositive();
export const CHAT_ID = env.get("CHAT_ID").required().asIntNegative();
export const ID_VIOLATIONS_LOG_CHANNEL = env.get("ID_VIOLATIONS_LOG_CHANNEL").required().asIntNegative();

export const WHITELISTED_CHAT_IDS: number[] = env
  .get("WHITELISTED_CHAT_IDS")
  .default("")
  .asString()
  .split(",")
  .filter(Boolean)
  .map(Number);
