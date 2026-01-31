import { Api } from "grammy";
import { readdirSync } from "fs";
import { join } from "path";
import { API_KEY } from "../src/config";
import { getActiveChatIds } from "../src/services/ChatRegistryService";

/**
 * Script to list all groups where the bot is a member
 * Uses chat registry as primary source, falls back to log files for legacy data
 * 
 * Usage: npm run list-groups
 */

const LOG_DIR = join(process.cwd(), "logs");

export interface GroupInfo {
    chatId: number;
    title: string;
    username?: string;
    isAdmin: boolean;
    canBanUsers: boolean;
}

/**
 * Get chat IDs from log files (legacy fallback for chats tracked before registry existed)
 */
const getChatIdsFromLogs = (): number[] => {
    try {
        const files = readdirSync(LOG_DIR);
        const chatIds = new Set<number>();

        for (const file of files) {
            if (file.endsWith(".ban.log")) {
                // Extract negative chat ID from filename (e.g., "chatname-username-1001234567890.ban.log")
                const match = file.match(/(-\d+)\.ban\.log$/);
                if (match) {
                    chatIds.add(parseInt(match[1], 10));
                }
            }
        }

        return Array.from(chatIds);
    } catch {
        return [];
    }
};

/**
 * Get all unique chat IDs from both registry and logs
 */
const getAllKnownChatIds = (): number[] => {
    const allIds = new Set([...getActiveChatIds(), ...getChatIdsFromLogs()]);
    return Array.from(allIds);
};

/**
 * Get information about the bot in a specific chat
 */
const getBotStatusInChat = async (api: Api, chatId: number): Promise<GroupInfo | null> => {
    try {
        const chat = await api.getChat(chatId);
        
        const botInfo = await api.getMe();
        const botMember = await api.getChatMember(chatId, botInfo.id);

        const isAdmin = botMember.status === "administrator" || botMember.status === "creator";
        const canBanUsers = isAdmin && 
            (botMember.status === "creator" || 
             (botMember.status === "administrator" && botMember.can_restrict_members === true));

        return {
            chatId,
            title: "title" in chat && chat.title ? chat.title : `Chat ${chatId}`,
            username: "username" in chat ? chat.username : undefined,
            isAdmin,
            canBanUsers
        };
    } catch (error: any) {
        // Bot might have been removed from the chat
        if (error.error_code === 403 || error.error_code === 400) {
            console.log(`⚠️  Cannot access chat ${chatId} (bot may have been removed)`);
            return null;
        }
        console.error(`Failed to get status for chat ${chatId}: ${error.message}`);
        return null;
    }
};

/**
 * Get all groups where bot is a member with their status
 * @param silent - If true, suppress console output (useful when importing)
 */
export const getAllBotGroups = async (silent = false): Promise<GroupInfo[]> => {
    const api = new Api(API_KEY as string);
    const chatIds = getAllKnownChatIds();

    if (chatIds.length === 0) {
        if (!silent) {
            console.log("No chat IDs found in registry or log files.");
        }
        return [];
    }

    if (!silent) {
        console.log(`Found ${chatIds.length} chat(s). Checking bot status...`);
    }

    const groups: GroupInfo[] = [];

    for (const chatId of chatIds) {
        const groupInfo = await getBotStatusInChat(api, chatId);
        if (groupInfo) {
            groups.push(groupInfo);
        }
    }

    return groups;
};

/**
 * Get all chat IDs where bot has ban permissions
 */
export const getChatIdsWithBanPermission = async (): Promise<number[]> => {
    const groups = await getAllBotGroups(true);
    return groups
        .filter(g => g.canBanUsers)
        .map(g => g.chatId);
};

// Run as standalone script only when executed directly
const isMainModule = require.main === module;

if (isMainModule) {
    const main = async () => {
        console.log("🔍 Scanning for bot groups...\n");

        const groups = await getAllBotGroups();

        if (groups.length === 0) {
            console.log("\n❌ No accessible groups found.");
            process.exit(0);
        }

        console.log("\n📋 Bot Groups:\n");
        console.log("─".repeat(80));

        for (const group of groups) {
            const adminStatus = group.isAdmin ? "✅ Admin" : "❌ Not Admin";
            const banStatus = group.canBanUsers ? "✅ Can Ban" : "❌ Cannot Ban";
            const username = group.username ? `@${group.username}` : "no username";

            console.log(`📍 ${group.title}`);
            console.log(`   ID: ${group.chatId} | ${username}`);
            console.log(`   ${adminStatus} | ${banStatus}`);
            console.log("─".repeat(80));
        }

        const adminGroups = groups.filter(g => g.isAdmin);
        const banCapableGroups = groups.filter(g => g.canBanUsers);

        console.log(`\n📊 Summary:`);
        console.log(`   Total groups: ${groups.length}`);
        console.log(`   Admin in: ${adminGroups.length} group(s)`);
        console.log(`   Can ban in: ${banCapableGroups.length} group(s)`);

        process.exit(0);
    };

    main();
}
