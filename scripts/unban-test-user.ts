import { Api } from "grammy";
import { API_KEY, TEST_USER_ID, CHAT_ID } from "../src/config";

/**
 * Script to unban the test user from all chats where the bot is admin
 * 
 * Usage: npm run unban-test-user
 */

const unbanTestUser = async () => {
    const api = new Api(API_KEY as string);

    // You need to specify the chat ID where you want to unban the user
    // Replace this with your actual chat ID or pass it as a command-line argument
    const chatId = CHAT_ID;

    if (!chatId) {
        console.error("❌ Error: Chat ID is required");
        console.log("\nUsage: npm run unban-test-user <CHAT_ID>");
        console.log("\nExample: npm run unban-test-user -1001234567890");
        console.log("\nTo get the chat ID:");
        console.log("1. Add the bot to your group");
        console.log("2. Send a message in the group");
        console.log("3. Check the bot logs for 'chatId' field");
        process.exit(1);
    }

    try {
        console.log(`🔓 Unbanning user ${TEST_USER_ID} from chat ${chatId}...`);
        
        // Unban the user
        // only_if_banned: true means unban only if the user is currently banned
        await api.unbanChatMember(chatId, TEST_USER_ID, {
            only_if_banned: true,
        });

        console.log(`✅ Successfully unbanned user ${TEST_USER_ID} from chat ${chatId}`);
    } catch (error: any) {
        console.error(`❌ Failed to unban user: ${error.message}`);
        
        if (error.error_code === 400) {
            console.log("\nPossible reasons:");
            console.log("- The user is not banned");
            console.log("- Invalid chat ID");
            console.log("- The bot is not an admin in this chat");
        } else if (error.error_code === 403) {
            console.log("\nThe bot doesn't have permission to unban users.");
            console.log("Make sure the bot has 'Ban users' permission in the group settings.");
        }
        
        process.exit(1);
    }

    process.exit(0);
};

unbanTestUser();
