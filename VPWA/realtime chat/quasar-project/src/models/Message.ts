import type { User } from 'src/models/User';
import type { Mention } from 'src/models/Mention';

export interface Message {
  id: string;
  channelId: string;
  content: string;
  userId: number;
  sentAt: string;
  user: User;
  mentions: Mention[];
}
