export type UserRole = 'ADMIN' | 'USER';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  token?: string; 
}