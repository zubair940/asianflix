import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { getCollection } from '../../backend/config/mongodb/mongoStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const secret = req.headers['x-migration-secret'];
    if (secret !== process.env.MIGRATION_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const file = path.join(process.cwd(), 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(file, 'utf8'));
    const collection = await getCollection('users');

    for (const user of users) {
      await collection.replaceOne({ id: user.id }, user, { upsert: true });
    }

    return res.json({ message: 'Users migrated successfully', count: users.length });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Migration failed' });
  }
}
