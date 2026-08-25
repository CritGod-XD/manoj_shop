import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const users = await db.all('SELECT id, username, role, created_at FROM users');
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, password } = await request.json();
    if (!username || !password || password.length < 6) {
      return NextResponse.json({ error: 'Username and password (min 6 characters) are required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if username already exists
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);
    await db.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'admin']
    );

    return NextResponse.json({ success: true, message: 'Admin account created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
