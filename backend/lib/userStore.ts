import { store, User } from '../config/store.js';
import { isMongoHealthy, getCollection, findOne, replaceOne, deleteOne, getAll } from '../config/mongodb/mongoStore.js';

async function usersCollection() {
  if (!(await isMongoHealthy())) return null;
  try {
    return await getCollection<User>('users');
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const clean = (email || '').trim().toLowerCase();
  const col = await usersCollection();
  if (col) {
    try {
      const u = await col.findOne({ email: clean });
      if (u) return u as User;
    } catch {
      // fall through to JSON store
    }
  }
  return store.users.find(u => u.email.toLowerCase() === clean);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const col = await usersCollection();
  if (col) {
    try {
      const u = await col.findOne({ id });
      if (u) return u as User;
    } catch {
      // fall through to JSON store
    }
  }
  return store.users.find(u => u.id === id);
}

export async function getAllUsers(): Promise<User[]> {
  const col = await usersCollection();
  if (col) {
    try {
      const users = await col.find({}).toArray();
      if (users.length > 0) return users as unknown as User[];
    } catch {
      // fall through to JSON store
    }
  }
  return store.users;
}

export async function upsertUser(user: User): Promise<void> {
  const idx = store.users.findIndex(u => u.id === user.id);
  if (idx >= 0) store.users[idx] = user;
  else store.users.push(user);
  store.saveUsers();

  const col = await usersCollection();
  if (col) {
    try {
      const { passwordHash, ...publicUser } = user;
      await col.replaceOne({ id: user.id }, { ...publicUser, passwordHash } as User, { upsert: true });
    } catch (err) {
      console.error('Failed to persist user to MongoDB:', (err as Error).message);
    }
  }
}

export async function removeUser(id: string): Promise<void> {
  const idx = store.users.findIndex(u => u.id === id);
  if (idx >= 0) store.users.splice(idx, 1);
  store.saveUsers();

  const col = await usersCollection();
  if (col) {
    try {
      await col.deleteOne({ id });
    } catch (err) {
      console.error('Failed to delete user from MongoDB:', (err as Error).message);
    }
  }
}

export async function seedUsersToMongo(): Promise<void> {
  const col = await usersCollection();
  if (!col) return;
  try {
    for (const user of store.users) {
      await col.replaceOne({ id: user.id }, user as User, { upsert: true });
    }
  } catch (err) {
    console.error('Failed to seed users to MongoDB:', (err as Error).message);
  }
}

export { findOne as findOneRaw, getAll as getAllRaw, deleteOne as deleteOneRaw };