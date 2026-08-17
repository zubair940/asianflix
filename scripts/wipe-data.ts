// AsianFlix data wipe — CLEAR ALL content data (keeps ONLY the admin user).
//
//   npm run wipe:data -- --dry-run   # preview what would be deleted
//   npm run wipe:data -- --yes       # actually wipe
//
// Cleans BOTH storage layers used by the app:
//   1. Local JSON store (./data/*.json — used when MongoDB isn't configured)
//   2. MongoDB collections (when MONGODB_URI is set in .env / environment)
//
// The admin user (iamzubair708@gmail.com) is preserved in both layers.
// Safe guard: refuses to run without --yes (or --dry-run for a preview).
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const ADMIN_EMAIL = 'iamzubair708@gmail.com';
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILES = [
  'users.json',
  'dramas.json',
  'episodes.json',
  'ratings.json',
  'history.json',
  'danmaku.json',
  'banners.json',
  'collections.json',
  'analytics.json',
];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirm = args.includes('--yes');

if (!confirm && !dryRun) {
  console.log('Data wipe requires a flag:');
  console.log('  Preview (no changes):  npm run wipe:data -- --dry-run');
  console.log('  Actually wipe:         npm run wipe:data -- --yes');
  process.exit(1);
}

const rootType = (value: unknown): 'array' | 'object' | null =>
  Array.isArray(value) ? 'array' : value !== null && typeof value === 'object' ? 'object' : null;

async function wipeJsonStore() {
  console.log(`\n=== Local JSON store (${DATA_DIR}) ===`);
  let totalRemoved = 0;
  for (const file of STORE_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf-8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.log(`  ${file}: unreadable (skipped)`);
      continue;
    }
    const type = rootType(parsed);
    if (!type) {
      console.log(`  ${file}: not an array/object (skipped)`);
      continue;
    }

    if (file === 'users.json' && type === 'array') {
      const users = parsed as { email?: string; role?: string }[];
      const admins = users.filter(
        (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || u.role === 'admin'
      );
      totalRemoved += users.length - admins.length;
      console.log(`  ${file}: ${users.length} users -> keeping ${admins.length} admin(s)`);
      if (!dryRun) fs.writeFileSync(filePath, JSON.stringify(admins, null, 2), 'utf-8');
    } else if (type === 'array') {
      const count = (parsed as unknown[]).length;
      totalRemoved += count;
      console.log(`  ${file}: ${count} records -> 0`);
      if (!dryRun) fs.writeFileSync(filePath, '[]', 'utf-8');
    } else {
      const count = Object.keys(parsed as Record<string, unknown>).length;
      totalRemoved += count;
      console.log(`  ${file}: ${count} keys -> {}`);
      if (!dryRun) fs.writeFileSync(filePath, '{}', 'utf-8');
    }
  }
  console.log(`  -> ${dryRun ? 'WOULD remove' : 'Removed'} ${totalRemoved} local records`);
}

async function wipeMongo() {
  const uri = process.env.MONGODB_URI;
  const configured = Boolean(uri && !uri.includes('<') && uri.startsWith('mongodb'));
  if (!configured) {
    console.log('\n=== MongoDB ===');
    console.log('  MONGODB_URI not configured locally — no Mongo collections touched.');
    console.log('  To clear production data later, set MONGODB_URI in .env and re-run this script.');
    return;
  }

  const client = new MongoClient(uri!, { ssl: true, serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db('asianflix');
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const masked = uri!.replace(/^mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb$1://***@');
    console.log(`\n=== MongoDB (${masked}) ===`);

    let totalDeleted = 0;
    for (const { name } of collections) {
      if (name.startsWith('system.')) continue;
      const col = db.collection(name);
      if (name === 'users') {
        const kept = await col.countDocuments({ $or: [{ email: ADMIN_EMAIL.toLowerCase() }, { role: 'admin' }] });
        const toRemove = await col.countDocuments({ email: { $ne: ADMIN_EMAIL.toLowerCase() } });
        totalDeleted += toRemove;
        console.log(`  ${name}: WOULD delete ${toRemove}, keeping ${kept} admin record(s)`);
        if (!dryRun) {
          await col.deleteMany({ email: { $ne: ADMIN_EMAIL.toLowerCase() } });
          console.log(`    -> deleted ${toRemove}`);
        }
      } else {
        const count = await col.countDocuments({});
        totalDeleted += count;
        console.log(`  ${name}: ${count} documents`);
        if (!dryRun) {
          await col.deleteMany({});
          console.log(`    -> deleted ${count}`);
        }
      }
    }
    console.log(`  -> ${dryRun ? 'WOULD delete' : 'Deleted'} ${totalDeleted} Mongo documents`);
  } catch (error: unknown) {
    console.error('  Mongo wipe failed:', (error as Error).message);
  } finally {
    await client.close();
  }
}

console.log(dryRun ? 'DRY RUN — nothing will be changed.\n' : 'EXECUTING WIPE...\n');

await wipeJsonStore();
await wipeMongo();

console.log(`\nDone. Admin (${ADMIN_EMAIL}) is preserved; everything else is ${dryRun ? 'untouched' : 'cleared'}.`);
