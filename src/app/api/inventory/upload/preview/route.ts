import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const CODE_SYNONYMS = ['item code', 'code', 'barcode', 'id', 'item_code', 'sl.no', 'sl no', 's.no', 's no', 'serial no', 'serial number', 'code number'];
const NAME_SYNONYMS = ['item name', 'name', 'item', 'description', 'title', 'item_name', 'particulars', 'particular', 'product', 'products', 'product name', 'product_name'];
const PRICE_SYNONYMS = ['cost', 'price', 'rate', 'selling price', 'mrp', 'selling_price', 'unit_price', 'unit price', 'unitrate', 'unit rate'];
const QTY_SYNONYMS = ['quantity', 'qty', 'stock', 'quantity in stock', 'in stock', 'stock_quantity', 'quantities', 'balance', 'stock qty', 'stock quantity', 'quantity_in_stock'];
const UNIT_SYNONYMS = ['unit', 'uom', 'measure', 'packaging', 'pkg'];
const CATEGORY_SYNONYMS = ['category', 'group', 'type', 'dept', 'department', 'cat'];

function findValueBySynonyms(row: any, synonyms: string[]): any {
  const keys = Object.keys(row);
  
  // 1. Try exact match first
  for (const syn of synonyms) {
    const match = keys.find(k => k.toLowerCase().trim() === syn.toLowerCase());
    if (match !== undefined) return row[match];
  }
  
  // 2. Try partial/substring match
  for (const syn of synonyms) {
    const match = keys.find(k => {
      const keyClean = k.toLowerCase().trim();
      const synClean = syn.toLowerCase();
      return keyClean.includes(synClean) || synClean.includes(keyClean);
    });
    if (match !== undefined) return row[match];
  }
  
  return undefined;
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let arrayBuffer: ArrayBuffer;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.sample) {
        const filePath = path.resolve(process.cwd(), 'sample_inventory.xlsx');
        if (!fs.existsSync(filePath)) {
          return NextResponse.json({ error: 'Sample file not found on server' }, { status: 404 });
        }
        const fileBuffer = fs.readFileSync(filePath);
        arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      } else {
        return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
      }
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      arrayBuffer = await file.arrayBuffer();
    }

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Scan the first few rows of the sheet to identify where the headers are
    const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    let headerRowIndex = 0;

    const ALL_SYNONYMS = [
      ...CODE_SYNONYMS,
      ...NAME_SYNONYMS,
      ...PRICE_SYNONYMS,
      ...QTY_SYNONYMS,
      ...UNIT_SYNONYMS,
      ...CATEGORY_SYNONYMS
    ];

    for (let i = 0; i < Math.min(rawData.length, 25); i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) continue;

      let matchCount = 0;
      let hasNameMatch = false;

      for (const cell of row) {
        if (cell === null || cell === undefined) continue;
        const cellStr = String(cell).toLowerCase().trim();

        // Check exact or partial match for header identification
        const matchesSyn = ALL_SYNONYMS.some(syn => cellStr === syn || cellStr.includes(syn) || syn.includes(cellStr));
        if (matchesSyn) {
          matchCount++;
        }
        const matchesName = NAME_SYNONYMS.some(syn => cellStr === syn || cellStr.includes(syn) || syn.includes(cellStr));
        if (matchesName) {
          hasNameMatch = true;
        }
      }

      if ((hasNameMatch && matchCount >= 2) || matchCount >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { range: headerRowIndex });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'Excel sheet is empty' }, { status: 400 });
    }

    const db = await getDb();
    const dbItems = await db.all('SELECT * FROM items');

    const mappedItems: any[] = [];
    let updatesCount = 0;
    let additionsCount = 0;
    let noChangeCount = 0;
    let pricesIncreased = 0;
    let pricesDecreased = 0;

    const seenCodesInBatch = new Set<string>();

    for (const row of rawRows) {
      const codeVal = findValueBySynonyms(row, CODE_SYNONYMS);
      const nameVal = findValueBySynonyms(row, NAME_SYNONYMS);
      const priceVal = findValueBySynonyms(row, PRICE_SYNONYMS);
      const qtyVal = findValueBySynonyms(row, QTY_SYNONYMS);
      const unitVal = findValueBySynonyms(row, UNIT_SYNONYMS);
      const catVal = findValueBySynonyms(row, CATEGORY_SYNONYMS);

      // Skip rows that don't have at least a name
      if (!nameVal) continue;

      const name = String(nameVal).trim();
      let code = codeVal ? String(codeVal).trim() : null;
      if (code === '') code = null;

      // Resolve duplicate and conflicting codes in Excel preview
      if (code) {
        const lowerCode = code.toLowerCase();
        const isDuplicateInExcel = seenCodesInBatch.has(lowerCode);
        const existingInDbWithCode = dbItems.find((item: any) => item.code && item.code.toLowerCase() === lowerCode);
        const isConflictInDb = existingInDbWithCode && existingInDbWithCode.name.toLowerCase() !== name.toLowerCase();

        if (isDuplicateInExcel || isConflictInDb) {
          code = null; // Self-heal: clear conflicting code
        } else {
          seenCodesInBatch.add(lowerCode);
        }
      }
      let price = priceVal !== undefined && priceVal !== null ? parseFloat(priceVal) : 0;
      if (isNaN(price)) price = 0;
      let quantity = qtyVal !== undefined && qtyVal !== null ? parseFloat(qtyVal) : 0;
      if (isNaN(quantity)) quantity = 0;
      const unit = unitVal ? String(unitVal).trim() : 'pcs';
      const category = catVal ? String(catVal).trim() : 'General';

      let match = dbItems.find((item: any) => {
        if (code && item.code && item.code.toLowerCase() === code.toLowerCase()) {
          return true;
        }
        return item.name.toLowerCase() === name.toLowerCase();
      });

      if (match) {
        const priceDiff = price - match.price;
        const qtyDiff = quantity - match.quantity;
        const isPriceChanged = Math.abs(priceDiff) > 0.001;
        const isQtyChanged = Math.abs(qtyDiff) > 0.001;
        const isUnitChanged = unit !== match.unit;
        const isCatChanged = category !== match.category;

        const hasChange = isPriceChanged || isQtyChanged || isUnitChanged || isCatChanged;

        let status = 'no_change';
        if (hasChange) {
          status = 'update';
          updatesCount++;
          if (price > match.price) pricesIncreased++;
          if (price < match.price) pricesDecreased++;
        } else {
          noChangeCount++;
        }

        mappedItems.push({
          id: match.id,
          code: code || match.code,
          name: match.name,
          price,
          quantity,
          unit,
          category,
          originalPrice: match.price,
          originalQuantity: match.quantity,
          originalUnit: match.unit,
          originalCategory: match.category,
          status,
        });
      } else {
        additionsCount++;
        mappedItems.push({
          id: null,
          code,
          name,
          price,
          quantity,
          unit,
          category,
          status: 'addition',
        });
      }
    }

    return NextResponse.json({
      summary: {
        totalRows: rawRows.length,
        updatesCount,
        additionsCount,
        noChangeCount,
        pricesIncreased,
        pricesDecreased,
      },
      items: mappedItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
