import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';

    const db = await getDb();

    let query = 'SELECT * FROM items WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY name ASC';

    const items = await db.all(query, params);
    
    // Also fetch all unique categories for filters
    const categoriesRows = await db.all('SELECT DISTINCT category FROM items ORDER BY category ASC');
    const categories = categoriesRows.map((row: any) => row.category).filter(Boolean);

    return NextResponse.json({ items, categories });
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

    // Check unique name constraint
    const existingName = await db.get('SELECT id FROM items WHERE name = ?', [name]);
    if (existingName) {
      return NextResponse.json({ error: 'An item with this name already exists' }, { status: 400 });
    }

    let cleanCode = code ? String(code).trim() : null;
    if (cleanCode === '') cleanCode = null;

    // Check unique code constraint if provided
    if (cleanCode) {
      const existingCode = await db.get('SELECT id FROM items WHERE LOWER(code) = ?', [cleanCode.toLowerCase()]);
      if (existingCode) {
        return NextResponse.json({ error: 'An item with this code already exists' }, { status: 400 });
      }
    }

    await db.run(
      'INSERT INTO items (code, name, price, quantity, unit, category) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanCode, name, parsedPrice, parsedQuantity, unit, category]
    );

    return NextResponse.json({ success: true, message: 'Item added successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
