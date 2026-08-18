// AsianFlix MongoDB indexes — creates the recommended indexes for the site's
// hot queries (dramas, episodes, ratings, history, analytics, users).
//
//   npm run indexes:create
//
// Safe to run repeatedly: createIndex is idempotent. Skips gracefully when
// MONGODB_URI is not set (app runs on the JSON store in that case).
import 'dotenv/config';
import { MongoClient, IndexSpecification } from 'mongodb';

const uri = process.env.MONGODB_URI;

async function main() {
  if (!uri || uri.includes('<') || !uri.startsWith('mongodb')) {
    console.log('MONGODB_URI not configured — no indexes created. (JSON store mode has no indexes to create.)');
    process.exit(0);
  }

  const client = new MongoClient(uri, { ssl: true, serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db('asianflix');
    console.log(`Connected to ${uri.replace(/^mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb$1://***@')}\n`);

    const indexes: Record<string, Record<string, number | string>[]> = {
      users: [{ email: 1 }],
      dramas: [
        { genre: 1 },
        { category: 1 },
        { views: -1 },
        { releaseYear: -1 },
        { averageRating: -1 },
      ],
      episodes: [{ dramaId: 1, episodeNumber: 1 }],
      ratings: [{ dramaId: 1 }, { userId: 1 }],
      history: [{ userId: 1, lastWatched: -1 }],
      danmaku: [{ episodeId: 1, timestampSec: 1 }],
      analytics: [{ type: 1, timestamp: -1 }],
      collections: [{ userId: 1 }],
    };

    for (const [collection, specs] of Object.entries(indexes)) {
      try {
        const col = db.collection(collection);
        for (const spec of specs) {
          const options: any = { background: true };
          if (collection === 'users' && spec.email !== undefined) options.unique = true;
          const name = await col.createIndex(spec as IndexSpecification, options);
          console.log(`  ${collection}: ${JSON.stringify(spec)} -> ${name} ${options.unique ? '(unique)' : ''}`);
        }
      } catch (error: unknown) {
        console.warn(`  ${collection}: skipped (${(error as Error).message})`);
      }
    }

    console.log('\nDone. Indexes are applied; queries on these fields no longer full-scan.');
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error('Failed:', (error as Error).message);
  process.exit(1);
});