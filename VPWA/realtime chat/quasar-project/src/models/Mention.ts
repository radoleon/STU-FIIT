import { type User } from 'src/models/User';

export interface Mention {
  id: number;
  messageId: string;
  userId: number;
  user: User;
}
