import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'venkata-srinivasa-kirana-secret-key-9999';

export interface UserPayload {
  id: number;
  username: string;
  role: string;
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function hasUsers(): Promise<boolean> {
  const db = await getDb();
  const row = await db.get('SELECT COUNT(*) as count FROM users');
  return (row?.count || 0) > 0;
}
