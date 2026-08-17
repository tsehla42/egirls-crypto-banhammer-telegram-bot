import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { findBannedChannel, loadBannedChannels } from '../bannedChannelsRule';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const CHANNELS_PATH = join(process.cwd(), 'data', 'banned-channels.json');
const originalData = readFileSync(CHANNELS_PATH, 'utf8');

const testChannels = {
  channels: [
    { name: 'Test Channel', username: '@testchannel', id: -100111222333 },
    { name: 'Spam Bot', username: '@spambot', id: -100444555666 },
  ],
};

beforeAll(() => {
  writeFileSync(CHANNELS_PATH, JSON.stringify(testChannels, null, 2));
  loadBannedChannels();
});

afterAll(() => {
  writeFileSync(CHANNELS_PATH, originalData);
});

describe('findBannedChannel', () => {
  describe('sender ID matching', () => {
    it('matches when sender ID equals a banned channel ID', () => {
      const result = findBannedChannel('', -100111222333);
      expect(result).toEqual({
        channelName: 'Test Channel',
        channelId: -100111222333,
        matchedBy: 'id',
      });
    });

    it('returns null when sender ID does not match any banned channel', () => {
      const result = findBannedChannel('', -100999888777);
      expect(result).toBeNull();
    });

    it('returns null when senderId is undefined', () => {
      const result = findBannedChannel('hello');
      expect(result).toBeNull();
    });
  });

  describe('username in text matching', () => {
    it('matches when text contains a banned channel username', () => {
      const result = findBannedChannel('Subscribe to @testchannel for more');
      expect(result).toEqual({
        channelName: 'Test Channel',
        channelId: -100111222333,
        matchedBy: 'username',
      });
    });

    it('matches case-insensitively', () => {
      const result = findBannedChannel('Check out @TESTCHANNEL');
      expect(result).toEqual({
        channelName: 'Test Channel',
        channelId: -100111222333,
        matchedBy: 'username',
      });
    });

    it('returns null when text does not contain any banned username', () => {
      const result = findBannedChannel('Hello world, how are you?');
      expect(result).toBeNull();
    });

    it('returns null for empty text', () => {
      const result = findBannedChannel('');
      expect(result).toBeNull();
    });
  });

  describe('priority', () => {
    it('returns ID match when both ID and username would match', () => {
      // sender ID matches first channel, text contains second channel username
      const result = findBannedChannel('Check @spambot', -100111222333);
      expect(result?.matchedBy).toBe('id');
    });
  });
});