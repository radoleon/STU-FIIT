import { type Invite } from 'src/models/Invite';
import { type User } from 'src/models/User';
import { type Message } from 'src/models/Message';

export interface Channel {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  invites?: Invite[];
  messages?: Message[];
  users?: User[];
}

export interface ChannelPayload {
  name: string;
  isPublic: boolean;
}
