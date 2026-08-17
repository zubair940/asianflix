// AsianFlix Vercel Blob wipe — deletes EVERY file from Vercel Blob storage,
// freeing the 1GB quota immediately.
//
//   npm run wipe:blob -- --dry-run   # preview
//   npm run wipe:blob -- --yes       # actually delete everything
//
// Requires BLOB_READ_WRITE_TOKEN:
//   Vercel Dashboard -> your project -> Storage -> Blob -> Settings -> copy the
//   token, then set it in .env (BLOB_READ_WRITE_TOKEN=...) or your shell.
import 'dotenv/config';
import { list, del } from '@vercel/blob';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirm = args.includes('--yes');

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.log('BLOB_READ_WRITE_TOKEN is not set.');
  console.log('Get it: Vercel Dashboard -> project -> Storage -> Blob store -> Settings.');
  console.log('Then add to .env: BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx');
  process.exit(1);
}

if (!confirm && !dryRun) {
  console.log('Blob wipe requires a flag:');
  console.log('  Preview (no changes):  npm run wipe:blob -- --dry-run');
  console.log('  Actually wipe:         npm run wipe:blob -- --yes');
  process.exit(1);
}

async function main() {
  console.log(dryRun ? 'DRY RUN — nothing will be deleted.' : 'EXECUTING BLOB WIPE...');
  const all: { url: string; size: number }[] = [];
  let cursor: string | undefined;
  do {
    const page: any = await list({ limit: 1000, cursor });
    all.push(...page.blobs.map((b: any) => ({ url: b.url, size: b.size })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const totalMB = Math.round((all.reduce((s, b) => s + b.size, 0) / (1024 * 1024)) * 100) / 100;
  console.log(`Found ${all.length} blob(s), ${totalMB} MB total.`);

  if (!confirm || all.length === 0) {
    console.log(dryRun ? 'Nothing deleted (preview only).' : 'Nothing deleted (dry run — pass --yes to execute).');
    return;
  }

  for (let i = 0; i < all.length; i += 500) {
    const batch = all.slice(i, i + 500).map((b) => b.url);
    await del(batch);
    console.log(`  deleted ${Math.min(500, batch.length)} blobs (${i + batch.length}/${all.length})`);
  }
  console.log(`\nDone. Deleted ${all.length} blob(s), ${totalMB} MB freed.`);
}

main().catch((error: unknown) => {
  console.error('Blob wipe failed:', (error as Error).message);
  process.exit(1);
});
