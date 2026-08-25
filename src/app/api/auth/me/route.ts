import { NextResponse } from 'next/server';
import { getCurrentUser, hasUsers } from '@/lib/auth';

export async function GET() {
  try {
    const isSetupDone = await hasUsers();
    if (!isSetupDone) {
      return NextResponse.json({ setupRequired: true });
    }

    const user = await getCurrentUser();
    return NextResponse.json({ setupRequired: false, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
