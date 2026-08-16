import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db> | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(uri && !uri.includes('<') && uri.startsWith('mongodb'));
}

export function getMongoClient(): MongoClient | null {
  return client;
}

export async function getDb(): Promise<Db | null> {
  if (db) return db;
  if (!isMongoConfigured()) return null;

  if (!client) {
    client = new MongoClient(uri!, {
      ssl: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 15000,
    });
  }

  if (!connecting) {
    connecting = client
      .connect()
      .then(() => {
        db = client!.db('asianflix');
        return db;
      })
      .catch((err) => {
        console.error('MongoDB connection failed:', err.message);
        connecting = null;
        return null;
      });
  }

  return connecting;
}