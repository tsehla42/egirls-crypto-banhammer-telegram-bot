import { config as loadEnv } from "dotenv";
import env from "env-var";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

export const API_KEY = env.get("API_KEY").required().asString();
