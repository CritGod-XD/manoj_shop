import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // 1. Capture today's date formatted as DD-MM-YYYY
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}-${mm}-${yyyy}`;

    // 2. Fetch today's sales
    const todaySalesRow = await db.get(
      'SELECT SUM(total_amount) as total, COUNT(*) as count FROM bills WHERE date = ?',
      [dateStr]
    );
    const todaySales = todaySalesRow?.total || 0;
    const todayBillCount = todaySalesRow?.count || 0;

    // 3. Fetch inventory stats
    const totalItemsRow = await db.get('SELECT COUNT(*) as count FROM items');
    const totalItems = totalItemsRow?.count || 0;

    // 4. Fetch low stock count (less than or equal to 10 units, excluding items with 0 or negative stock if we want, or just <= 10)
    const lowStockRow = await db.get('SELECT COUNT(*) as count FROM items WHERE quantity <= 10');
    const lowStockCount = lowStockRow?.count || 0;

    // 5. Fetch recent 5 bills
    const recentBills = await db.all('SELECT * FROM bills ORDER BY id DESC LIMIT 5');

    // 6. Fetch top 5 low stock items
    const lowStockItems = await db.all(
      'SELECT * FROM items WHERE quantity <= 10 ORDER BY quantity ASC LIMIT 5'
    );

    return NextResponse.json({
      todaySales,
      todayBillCount,
      totalItems,
      lowStockCount,
      recentBills,
      lowStockItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
