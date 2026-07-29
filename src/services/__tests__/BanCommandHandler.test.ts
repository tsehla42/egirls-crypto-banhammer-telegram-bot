import { describe, it, expect, vi, beforeEach } from "vitest";
import { Context } from "grammy";

vi.mock("../../config", () => ({
  BOT_ADMIN_IDS: [111111, -1002222222222],
  ID_VIOLATIONS_LOG_CHANNEL: -1003718656904,
}));

vi.mock("../ChatPermissionService", () => ({
  isUserAdmin: vi.fn().mockResolvedValue(false),
  isBotAllowedToBan: vi.fn().mockResolvedValue(true),
  getLinkedChannelId: vi.fn().mockResolvedValue(null),
}));

vi.mock("../LogService", () => ({
  logBan: vi.fn(),
}));

vi.mock("../../utils", () => ({
  formatUserIdentifier: vi.fn((from?: any) => from?.first_name ?? "Unknown"),
  formatChatIdentifier: vi.fn((chat?: any) => chat?.title ?? "Unknown chat"),
  escapeHtml: vi.fn((text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  ),
  deleteMessage: vi.fn().mockResolvedValue(undefined),
  forwardMessageToChannel: vi.fn().mockResolvedValue(undefined),
  resolveTargetFromReply: vi.fn((replyTo: any) => replyTo.from || replyTo.sender_chat),
  resolveTargetName: vi.fn((replyTo: any) => replyTo.from?.first_name ?? replyTo.sender_chat?.title ?? "Unknown"),
  resolveLogUser: vi.fn((replyTo: any, targetId: number) => replyTo.from || { id: targetId, first_name: "Unknown", is_bot: false }),
  isKnownBanFailure: vi.fn((error: any) => false),
  parseBanFlags: vi.fn((text: string) => ({ silent: false })),
}));

import { isAuthorizedForBan, handleBanCommand } from "../../handlers/BanCommandHandler";
import { isUserAdmin, isBotAllowedToBan, getLinkedChannelId } from "../ChatPermissionService";
import { deleteMessage, forwardMessageToChannel } from "../../utils";

const makeCtx = (
  overrides: Partial<{
    fromId: number;
    senderChatId: number | null;
    chatType: string;
    chatId: number;
    replyToMessage: boolean;
    replyFromId: number;
  }> = {}
): Context => {
  return {
    from:
      overrides.fromId !== undefined
        ? { id: overrides.fromId, first_name: "Test", last_name: "User", is_bot: false }
        : undefined,
    sender_chat:
      overrides.senderChatId !== undefined
        ? { id: overrides.senderChatId, type: "channel", title: "Test Channel" }
        : undefined,
    senderChat:
      overrides.senderChatId !== undefined
        ? { id: overrides.senderChatId, type: "channel", title: "Test Channel" }
        : undefined,
    chat: overrides.chatType
      ? { id: overrides.chatId ?? -1001234567890, type: overrides.chatType }
      : undefined,
    message: {
      message_id: 123,
      reply_to_message: overrides.replyToMessage
        ? {
            message_id: 456,
            from: {
              id: overrides.replyFromId ?? 999999,
              first_name: "Target",
              is_bot: false,
            },
          }
        : undefined,
    },
    api: {
      banChatMember: vi.fn().mockResolvedValue(true),
      deleteMessage: vi.fn().mockResolvedValue(true),
      sendMessage: vi.fn().mockResolvedValue(true),
      forwardMessage: vi.fn().mockResolvedValue(true),
    },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isUserAdmin).mockResolvedValue(false);
  vi.mocked(isBotAllowedToBan).mockResolvedValue(true);
});

describe("isAuthorizedForBan", () => {
  it("returns true when sender is a bot admin by user ID", async () => {
    const ctx = makeCtx({ chatType: "group", fromId: 111111 });
    expect(await isAuthorizedForBan(ctx)).toBe(true);
  });

  it("returns true when sender is a bot admin by channel ID", async () => {
    const ctx = makeCtx({ chatType: "group", fromId: 999999, senderChatId: -1002222222222 });
    expect(await isAuthorizedForBan(ctx)).toBe(true);
  });

  it("returns true when sender is a chat admin via API", async () => {
    vi.mocked(isUserAdmin).mockResolvedValue(true);
    const ctx = makeCtx({ chatType: "group", fromId: 999999 });
    expect(await isAuthorizedForBan(ctx)).toBe(true);
    expect(isUserAdmin).toHaveBeenCalled();
  });

  it("returns false for unknown non-admin user", async () => {
    const ctx = makeCtx({ chatType: "group", fromId: 999999 });
    expect(await isAuthorizedForBan(ctx)).toBe(false);
  });

  it("returns false when from is undefined", async () => {
    const ctx = makeCtx({ chatType: "group" });
    expect(await isAuthorizedForBan(ctx)).toBe(false);
  });
});

describe("handleBanCommand — rejection paths", () => {
  it("does nothing when chat is missing", async () => {
    const ctx = makeCtx({});
    await handleBanCommand(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it("does nothing when chat type is private", async () => {
    const ctx = makeCtx({ chatType: "private" });
    await handleBanCommand(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it("does nothing when message has no reply", async () => {
    const ctx = makeCtx({ chatType: "supergroup", replyToMessage: false });
    await handleBanCommand(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it("silently deletes message for unauthorized user", async () => {
    vi.mocked(isUserAdmin).mockResolvedValue(false);
    const ctx = makeCtx({
      chatType: "group",
      fromId: 999999,
      replyToMessage: true,
    });
    await handleBanCommand(ctx);
    expect(deleteMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      123
    );
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});

describe("handleBanCommand — happy path", () => {
  it("bans target user, deletes messages, sends confirmation, forwards to log", async () => {
    const ctx = makeCtx({
      chatType: "supergroup",
      fromId: 111111,
      replyToMessage: true,
      replyFromId: 999999,
    });

    await handleBanCommand(ctx);

    expect(ctx.api.banChatMember).toHaveBeenCalledWith(
      expect.any(Number),
      999999
    );
    expect(deleteMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      123
    );
    expect(deleteMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      456
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Banned user"),
      { parse_mode: "HTML" }
    );
    expect(forwardMessageToChannel).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.any(Number),
      456
    );
  });

  it("escapes HTML in target and admin names", async () => {
    const ctx = makeCtx({
      chatType: "supergroup",
      fromId: 111111,
      replyToMessage: true,
      replyFromId: 999999,
    });

    // Set target name with HTML characters
    (ctx.message as any).reply_to_message.from.first_name = "John <b>DOE</b>";

    await handleBanCommand(ctx);

    const replyCall = vi.mocked(ctx.reply).mock.calls[0];
    const replyText = replyCall[0] as string;
    expect(replyText).not.toContain("<b>DOE</b>");
    expect(replyText).toContain("John &lt;b&gt;DOE&lt;/b&gt;");
  });

  it("falls back to sender_chat when from is missing", async () => {
    const ctx = makeCtx({
      chatType: "supergroup",
      fromId: 111111,
      replyToMessage: true,
    });

    // Override message to have sender_chat but no from
    (ctx.message as any).reply_to_message = {
      message_id: 456,
      sender_chat: {
        id: 888888,
        type: "channel",
        title: "Spam Channel",
      },
    };

    await handleBanCommand(ctx);

    expect(ctx.api.banChatMember).toHaveBeenCalledWith(
      expect.any(Number),
      888888
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Spam Channel"),
      { parse_mode: "HTML" }
    );
  });
});
