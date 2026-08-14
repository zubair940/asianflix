import fs from 'fs';
import path from 'path';
import { getCollection } from './mongoStore.js';

type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  watchlist: string[];
  createdAt: string;
};

async function main() {
  const file = path.join(process.cwd(), 'data', 'users.json');
  const users: User[] = JSON.parse(fs.readFileSync(file, 'utf8'));
  const collection = await getCollection<User>('users');

  for (const user of users) {
    await collection.replaceOne({ id: user.id }, user as any, { upsert: true });
    console.log('Migrated:', user.email);
  }

  console.log('USER_MIGRATION_OK');
  process.exit(0);
}

main().catch(error => {
  console.error('USER_MIGRATION_FAILED', error);
  process.exit(1);
});
