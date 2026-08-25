import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
