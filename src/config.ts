import { config as loadEnv } from "dotenv";
import env from "env-var";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

export const API_KEY = env.get("API_KEY").required().asString();
export const TEST_USER_ID = env.get("TEST_USER_ID").required().asIntPositive();
export const CHAT_ID = env.get("CHAT_ID").required().asIntNegative();
