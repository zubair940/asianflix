import { getDb } from './connection.js';

export async function getCollection<T = any>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

export async function getAll<T = any>(name: string): Promise<T[]> {
  const collection = await getCollection<T>(name);
  const docs = await collection.find({}).toArray();
  return docs as unknown as T[];
}

export async function findOne<T = any>(name: string, filter: Record<string, any>): Promise<T | null> {
  const collection = await getCollection<T>(name);
  return await collection.findOne(filter) as T | null;
}

export async function insertOne<T = any>(name: string, document: T) {
  const collection = await getCollection<T>(name);
  return await collection.insertOne(document as any);
}

export async function replaceOne<T = any>(name: string, filter: Record<string, any>, document: T) {
  const collection = await getCollection<T>(name);
  return await collection.replaceOne(filter, document as any, { upsert: true });
}

export async function deleteOne(name: string, filter: Record<string, any>) {
  const collection = await getCollection(name);
  return await collection.deleteOne(filter);
}
