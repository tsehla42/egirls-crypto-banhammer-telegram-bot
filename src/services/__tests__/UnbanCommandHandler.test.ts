import { describe, it, expect, vi, beforeEach } from "vitest";
import { Context } from "grammy";

vi.mock("../../config", () => ({
  BOT_ADMIN_IDS: [111111, -1002222222222],
}));

vi.mock("../ChatPermissionService", () => ({
  isUserAdmin: vi.fn().mockResolvedValue(false),
  isBotAllowedToBan: vi.fn().mockResolvedValue(true),
  getLinkedChannelId: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../utils", () => ({
  deleteMessage: vi.fn().mockResolvedValue(undefined),
}));

import { handleUnbanCommand } from "../../handlers/UnbanCommandHandler";
import { isUserAdmin, isBotAllowedToBan } from "../ChatPermissionService";
import { deleteMessage } from "../../utils";

const BOT_ID = 12345;

const makeCtx = (
  overrides: Partial<{
    fromId: number;
    chatType: string;
    chatId: number;
    replyToMessageFromId: number;
    replyToMessageFromIsBot: boolean;
    replyToMessageText: string;
    commandText: string;
    meId: number;
    memberStatus: string;
  }> = {}
): Context => {
  const chatId = overrides.chatId ?? -1001234567890;
  return {
    from:
      overrides.fromId !== undefined
        ? { id: overrides.fromId, first_name: "Admin", is_bot: false }
        : undefined,
    chat: overrides.chatType
      ? { id: chatId, type: overrides.chatType }
      : undefined,
    me: {
      id: overrides.meId ?? BOT_ID,
      is_bot: true,
      first_name: "TestBot",
      username: "testbot",
    },
    message: {
      message_id: 123,
      text: overrides.commandText,
      reply_to_message:
        overrides.replyToMessageFromId !== undefined
          ? {
              message_id: 456,
              text: overrides.replyToMessageText,
              from: {
                id: overrides.replyToMessageFromId,
                first_name: "Target",
                is_bot: overrides.replyToMessageFromIsBot ?? false,
              },
            }
          : undefined,
    },
    api: {
      getChatMember: vi.fn().mockResolvedValue({
        status: overrides.memberStatus ?? "kicked",
      }),
      unbanChatMember: vi.fn().mockResolvedValue(true),
      deleteMessage: vi.fn().mockResolvedValue(true),
    },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isUserAdmin).mockResolvedValue(false);
  vi.mocked(isBotAllowedToBan).mockResolvedValue(true);
});

describe("handleUnbanCommand", () => {
  it("does nothing when chat is private", async () => {
    const ctx = makeCtx({ chatType: "private", fromId: 111111 });
    await handleUnbanCommand(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it("silently deletes message for unauthorized user", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 999999,
      replyToMessageFromId: BOT_ID,
      replyToMessageFromIsBot: true,
    });
    await handleUnbanCommand(ctx);
    expect(deleteMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      123
    );
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("replies with usage hint when replying to non-bot message", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      replyToMessageFromId: 999999,
      replyToMessageFromIsBot: false,
    });
    await handleUnbanCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Usage"),
      { parse_mode: "HTML" }
    );
    expect(ctx.api.unbanChatMember).not.toHaveBeenCalled();
  });

  it("replies with no-permission when bot cannot ban", async () => {
    vi.mocked(isBotAllowedToBan).mockResolvedValue(false);
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      replyToMessageFromId: BOT_ID,
      replyToMessageFromIsBot: true,
    });
    await handleUnbanCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("permission"),
      { parse_mode: "HTML" }
    );
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it("unbans user when replying to bot's ban message with ID", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      replyToMessageFromId: BOT_ID,
      replyToMessageFromIsBot: true,
      replyToMessageText: "🖕 Banned user <b>Spammer</b> (<code>888888</code>)",
      meId: BOT_ID,
      memberStatus: "kicked",
    });
    await handleUnbanCommand(ctx);
    expect(ctx.api.unbanChatMember).toHaveBeenCalledWith(
      expect.any(Number),
      888888,
      { only_if_banned: true }
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("888888"),
      { parse_mode: "HTML" }
    );
  });

  it("replies with usage hint when ban message has no ID", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      replyToMessageFromId: BOT_ID,
      replyToMessageFromIsBot: true,
      replyToMessageText: "This is not a ban message",
      meId: BOT_ID,
    });
    await handleUnbanCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Usage"),
      { parse_mode: "HTML" }
    );
    expect(ctx.api.unbanChatMember).not.toHaveBeenCalled();
  });

  it("unbans user by direct ID", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      commandText: "/unban 888888",
      memberStatus: "kicked",
    });
    await handleUnbanCommand(ctx);
    expect(ctx.api.unbanChatMember).toHaveBeenCalledWith(
      expect.any(Number),
      888888,
      { only_if_banned: true }
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("888888"),
      { parse_mode: "HTML" }
    );
  });

  it("replies with usage hint when no target provided", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      commandText: "/unban",
    });
    await handleUnbanCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Usage"),
      { parse_mode: "HTML" }
    );
  });

  it("replies with usage hint for invalid ID format", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      commandText: "/unban abc",
    });
    await handleUnbanCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Usage"),
      { parse_mode: "HTML" }
    );
  });

  it("handles unbanChatMember API error", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      replyToMessageFromId: BOT_ID,
      replyToMessageFromIsBot: true,
      replyToMessageText: "🖕 Banned user <b>Spammer</b> (<code>888888</code>)",
      meId: BOT_ID,
      memberStatus: "kicked",
    });
    vi.mocked(ctx.api.unbanChatMember).mockRejectedValue(
      new Error("user is not a member")
    );
    await handleUnbanCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Failed to unban"),
      { parse_mode: "HTML" }
    );
  });

  it("silently deletes message when user is already unbanned (reply path)", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      replyToMessageFromId: BOT_ID,
      replyToMessageFromIsBot: true,
      replyToMessageText: "🖕 Banned user <b>Spammer</b> (<code>888888</code>)",
      meId: BOT_ID,
      memberStatus: "member",
    });
    await handleUnbanCommand(ctx);
    expect(deleteMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      123
    );
    expect(ctx.api.unbanChatMember).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("silently deletes message when user is already unbanned (direct ID path)", async () => {
    const ctx = makeCtx({
      chatType: "group",
      fromId: 111111,
      commandText: "/unban 888888",
      memberStatus: "member",
    });
    await handleUnbanCommand(ctx);
    expect(deleteMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      123
    );
    expect(ctx.api.unbanChatMember).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
