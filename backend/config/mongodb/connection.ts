import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const client = new MongoClient(uri);
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  await client.connect();
  db = client.db('asianflix');
  console.log('MongoDB connected successfully');
  return db;
}

export { client };
