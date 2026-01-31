import { Api } from "grammy";
import { API_KEY, TEST_USER_ID } from "../src/config";
import { getAllBotGroups } from "./list-bot-groups";

/**
 * Script to unban the test user from all chats where the bot is admin
 * 
 * Usage: npm run unban-test-user
 */

const unbanTestUser = async () => {
  const api = new Api(API_KEY as string);

  console.log(`🔍 Finding all groups where bot has ban permissions...\n`);

  const groups = await getAllBotGroups(true);
  const banCapableGroups = groups.filter(g => g.canBanUsers);

  if (banCapableGroups.length === 0) {
    console.log("❌ No groups found where bot can ban users.");
    console.log("\nMake sure:");
    console.log("1. The bot is an admin in at least one group");
    console.log("2. The bot has 'Ban users' permission");
    console.log("3. There are log files in the 'logs' directory");
    process.exit(1);
  }

  console.log(`Found ${banCapableGroups.length} group(s) with ban permissions.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const group of banCapableGroups) {
    try {
      console.log(`🔓 Unbanning user ${TEST_USER_ID} from "${group.title}" (${group.chatId})...`);

      // Unban the user
      // only_if_banned: true means unban only if the user is currently banned
      await api.unbanChatMember(group.chatId, TEST_USER_ID, {
        only_if_banned: true,
      });

      console.log(`   ✅ Successfully unbanned from "${group.title}"`);
      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Failed to unban from "${group.title}": ${error.message}`);
      failCount++;

      if (error.error_code === 400) {
        console.log("      Possible reasons: user not banned, invalid chat, or bot not admin");
      } else if (error.error_code === 403) {
        console.log("      Bot doesn't have permission to unban users in this chat");
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Total: ${banCapableGroups.length}`);

  process.exit(failCount > 0 ? 1 : 0);
};

unbanTestUser();
