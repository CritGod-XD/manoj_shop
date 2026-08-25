import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const date = searchParams.get('date') || '';

    const db = await getDb();

    let query = `
      SELECT b.*, 
             (SELECT COUNT(*) FROM bill_items WHERE bill_id = b.id) as total_items
      FROM bills b 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND b.bill_number LIKE ?';
      params.push(`%${search}%`);
    }

    if (date) {
      query += ' AND b.date = ?';
      params.push(date);
    }

    query += ' ORDER BY b.id DESC';

    const bills = await db.all(query, params);

    // Get line items for the bills
    for (const bill of bills) {
      bill.items = await db.all('SELECT * FROM bill_items WHERE bill_id = ?', [bill.id]);
    }

    return NextResponse.json({ bills });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Billing can be performed by staff, so we don't strictly require admin auth,
    // but if we want to log who billed it, we can. For now we make it public/staff-friendly.

    const { items, totalAmount } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in the bill' }, { status: 400 });
    }

    const db = await getDb();

    // Start a transaction
    await db.exec('BEGIN TRANSACTION');

    try {
      // 1. Generate auto-incrementing bill number
      const lastBill = await db.get('SELECT MAX(id) as maxId FROM bills');
      const nextId = (lastBill?.maxId || 0) + 1;
      const billNumber = String(nextId).padStart(6, '0');

      // 2. Capture current date and day
      const now = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = dayNames[now.getDay()];
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const dateStr = `${dd}-${mm}-${yyyy}`;

      // 3. Insert bill record
      const billResult = await db.run(
        'INSERT INTO bills (bill_number, date, day_of_week, total_amount) VALUES (?, ?, ?, ?)',
        [billNumber, dateStr, dayOfWeek, totalAmount]
      );
      const billId = billResult.lastID;

      // 4. Update inventory and insert bill items
      for (const item of items) {
        const itemTotal = item.price * item.quantity;
        
        // Insert item record
        await db.run(
          'INSERT INTO bill_items (bill_id, item_name, quantity, price, unit, item_total) VALUES (?, ?, ?, ?, ?, ?)',
          [billId, item.name, item.quantity, item.price, item.unit, itemTotal]
        );

        // Decrement quantity from inventory (allow stock to go negative)
        await db.run(
          'UPDATE items SET quantity = quantity - ? WHERE name = ?',
          [item.quantity, item.name]
        );
      }

      await db.exec('COMMIT');

      return NextResponse.json({
        success: true,
        billNumber,
        date: dateStr,
        dayOfWeek,
        id: billId,
      });
    } catch (err: any) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
