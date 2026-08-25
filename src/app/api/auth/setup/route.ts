import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, hasUsers } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isSetupDone = await hasUsers();
    if (isSetupDone) {
      return NextResponse.json({ error: 'Setup already completed' }, { status: 400 });
    }

    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const db = await getDb();
    const hashedPassword = hashPassword(password);

    await db.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      ['sivanarayana', hashedPassword, 'admin']
    );

    return NextResponse.json({ success: true, message: 'First admin account created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
