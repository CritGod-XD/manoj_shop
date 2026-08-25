import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const itemId = parseInt(id);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { name, price, quantity, unit, category, code } = await request.json();

    if (!name || price === undefined || quantity === undefined || !unit || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseFloat(quantity);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Price must be a valid non-negative number' }, { status: 400 });
    }

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return NextResponse.json({ error: 'Quantity must be a valid non-negative number' }, { status: 400 });
    }

    const db = await getDb();

    // Check unique name constraint (excluding current item)
    const existingName = await db.get('SELECT id FROM items WHERE name = ? AND id != ?', [name, itemId]);
    if (existingName) {
      return NextResponse.json({ error: 'An item with this name already exists' }, { status: 400 });
    }

    let cleanCode = code ? String(code).trim() : null;
    if (cleanCode === '') cleanCode = null;

    // Check unique code constraint if provided (excluding current item)
    if (cleanCode) {
      const existingCode = await db.get('SELECT id FROM items WHERE LOWER(code) = ? AND id != ?', [cleanCode.toLowerCase(), itemId]);
      if (existingCode) {
        return NextResponse.json({ error: 'An item with this code already exists' }, { status: 400 });
      }
    }

    await db.run(
      'UPDATE items SET name = ?, price = ?, quantity = ?, unit = ?, category = ?, code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, parsedPrice, parsedQuantity, unit, category, cleanCode, itemId]
    );

    return NextResponse.json({ success: true, message: 'Item updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const itemId = parseInt(id);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const db = await getDb();
    await db.run('DELETE FROM items WHERE id = ?', [itemId]);

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
