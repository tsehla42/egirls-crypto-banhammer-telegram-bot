import { Bot } from "grammy";
import { API_KEY} from "./config";


const bot = new Bot(API_KEY as string);

const startBot = async () => {
  await bot.start();
};

console.log("Bot is up and running");
startBot();