export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  createdAt: string;
  settings?: Setting;
  isAdmin: boolean | null;
}

export interface Setting {
  id: number;
  userId: number;
  onlyAddressed: boolean;
  statusId: 1 | 2 | 3;
}
