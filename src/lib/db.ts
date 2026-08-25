import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { Client } from '@neondatabase/serverless';

let dbInstance: any = null;

// Convert SQLite ? placeholders to Postgres $1, $2... placeholders
function convertPlaceholders(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

class NeonDatabaseWrapper {
  private connectionString: string;
  private client: Client | null = null;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  private async getClient(): Promise<Client> {
    // Check if client exists and is connected
    if (this.client && (this.client as any)._connected && !(this.client as any)._ending) {
      return this.client;
    }

    // Try ending existing client if present
    if (this.client) {
      try {
        await this.client.end();
      } catch (e) {
        // ignore
      }
      this.client = null;
    }

    const newClient = new Client({ connectionString: this.connectionString });
    await newClient.connect();

    newClient.on('error', (err) => {
      console.error('Neon Database Client error:', err);
      this.client = null;
    });

    this.client = newClient;
    return newClient;
  }

  private isConnectionError(err: any): boolean {
    const msg = (err.message || '').toLowerCase();
    return (
      msg.includes('connection') ||
      msg.includes('not connected') ||
      msg.includes('terminated') ||
      msg.includes('socket') ||
      msg.includes('closed') ||
      err.code === '57P01' || // admin_shutdown
      err.code === '57P02' || // crash_shutdown
      err.code === '57P03'    // cannot_connect_now
    );
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const pgSql = convertPlaceholders(sql);
    let attempts = 0;
    while (attempts < 2) {
      try {
        const client = await this.getClient();
        const res = await client.query(pgSql, params);
        return res.rows[0];
      } catch (err: any) {
        attempts++;
        if (attempts >= 2 || !this.isConnectionError(err)) {
          throw err;
        }
        this.client = null; // force reconnect on next attempt
      }
    }
    throw new Error("Neon query failed after max retries");
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const pgSql = convertPlaceholders(sql);
    let attempts = 0;
    while (attempts < 2) {
      try {
        const client = await this.getClient();
        const res = await client.query(pgSql, params);
        return res.rows;
      } catch (err: any) {
        attempts++;
        if (attempts >= 2 || !this.isConnectionError(err)) {
          throw err;
        }
        this.client = null;
      }
    }
    throw new Error("Neon query failed after max retries");
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    let pgSql = sql;
    const trimmed = sql.trim().toUpperCase();
    const isInsert = trimmed.startsWith("INSERT INTO");
    
    if (isInsert && !trimmed.includes("RETURNING")) {
      pgSql += " RETURNING id";
    }

    const convertedSql = convertPlaceholders(pgSql);
    let attempts = 0;
    while (attempts < 2) {
      try {
        const client = await this.getClient();
        const res = await client.query(convertedSql, params);
        
        let lastID = null;
        if (isInsert && res.rows.length > 0) {
          lastID = res.rows[0].id || res.rows[0].lastid || null;
        }

        return {
          lastID,
          changes: res.rowCount,
        };
      } catch (err: any) {
        attempts++;
        if (attempts >= 2 || !this.isConnectionError(err)) {
          throw err;
        }
        this.client = null;
      }
    }
    throw new Error("Neon query failed after max retries");
  }

  async exec(sql: string): Promise<any> {
    const pgSql = sql.replace(/BEGIN TRANSACTION/i, "BEGIN");
    let attempts = 0;
    while (attempts < 2) {
      try {
        const client = await this.getClient();
        return await client.query(pgSql);
      } catch (err: any) {
        attempts++;
        if (attempts >= 2 || !this.isConnectionError(err)) {
          throw err;
        }
        this.client = null;
      }
    }
    throw new Error("Neon query failed after max retries");
  }
}

export async function getDb(): Promise<any> {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    const wrapper = new NeonDatabaseWrapper(connectionString);
    
    // Initialize Schema for Postgres (using SERIAL PRIMARY KEY)
    const initSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE,
        name TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        category TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        bill_number TEXT UNIQUE NOT NULL,
        date TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bill_items (
        id SERIAL PRIMARY KEY,
        bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
        item_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        item_total REAL NOT NULL
      );
    `;
    
    await wrapper.exec(initSchema);
    dbInstance = wrapper;
    return dbInstance;
  } else {
    const dbPath = path.resolve(process.cwd(), 'shop.db');

    const sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await sqliteDb.exec('PRAGMA foreign_keys = ON;');

    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        category TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number TEXT UNIQUE NOT NULL,
        date TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
        item_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        item_total REAL NOT NULL
      );
    `);

    dbInstance = sqliteDb;
    return dbInstance;
  }
}
