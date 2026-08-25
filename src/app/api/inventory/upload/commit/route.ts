import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
    }

    const db = await getDb();

    // Start a transaction
    await db.exec('BEGIN TRANSACTION');

    try {
      for (const item of items) {
        if (item.status === 'update') {
          await db.run(
            'UPDATE items SET code = ?, price = ?, quantity = ?, unit = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [item.code || null, item.price, item.quantity, item.unit, item.category, item.id]
          );
        } else if (item.status === 'addition') {
          // Double check if item name already exists to avoid duplication
          const existing = await db.get('SELECT id FROM items WHERE name = ?', [item.name]);
          if (existing) {
            // If it exists, update it instead
            await db.run(
              'UPDATE items SET code = ?, price = ?, quantity = ?, unit = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [item.code || null, item.price, item.quantity, item.unit, item.category, existing.id]
            );
          } else {
            await db.run(
              'INSERT INTO items (code, name, price, quantity, unit, category) VALUES (?, ?, ?, ?, ?, ?)',
              [item.code || null, item.name, item.price, item.quantity, item.unit, item.category]
            );
          }
        }
      }

      await db.exec('COMMIT');
      return NextResponse.json({ success: true, message: 'Inventory updated successfully' });
    } catch (err: any) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
