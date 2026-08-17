import { readFileSync } from 'fs';
import { join } from 'path';

export interface BannedChannelMatch {
  channelName: string;
  channelId: number;
  matchedBy: 'id' | 'username';
}

interface BannedChannel {
  name: string;
  username: string;
  id: number;
}

interface BannedChannelsData {
  channels: BannedChannel[];
}

let bannedChannels: BannedChannel[] = [];

const loadBannedChannels = (): void => {
  try {
    const data: BannedChannelsData = JSON.parse(
      readFileSync(join(process.cwd(), 'data', 'banned-channels.json'), 'utf8')
    );
    bannedChannels = data.channels || [];
  } catch {
    console.error('[BannedChannelsRule] Failed to load banned-channels.json, no channels will be banned');
  }
};

loadBannedChannels();

export { loadBannedChannels };

export const findBannedChannel = (
  text: string,
  senderId?: number
): BannedChannelMatch | null => {
  if (senderId !== undefined) {
    for (const channel of bannedChannels) {
      if (senderId === channel.id) {
        return {
          channelName: channel.name,
          channelId: channel.id,
          matchedBy: 'id',
        };
      }
    }
  }

  if (text) {
    const lowerText = text.toLowerCase();
    for (const channel of bannedChannels) {
      if (lowerText.includes(channel.username.toLowerCase())) {
        return {
          channelName: channel.name,
          channelId: channel.id,
          matchedBy: 'username',
        };
      }
    }
  }

  return null;
};
