export type UserRole = 'student' | 'agent' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'admin';
  activeTicketsCount: number;
  avatarUrl?: string;
}
