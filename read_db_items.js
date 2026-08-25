const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function main() {
  const db = await open({
    filename: path.resolve(__dirname, 'shop.db'),
    driver: sqlite3.Database
  });
  
  const items = await db.all('SELECT name FROM items LIMIT 100');
  console.log(JSON.stringify(items.map(i => i.name)));
  await db.close();
}

main().catch(console.error);
