import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.js';
import { store, Rating, WatchHistory } from '../config/store.js';
import { findUserById, upsertUser, removeUser } from '../lib/userStore.js';

export const toggleWatchlist = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const { dramaId } = req.body;
  if (!dramaId) return res.status(400).json({ message: 'Drama ID is required' });

  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const existsIndex = user.watchlist.indexOf(dramaId);

  let added = false;
  if (existsIndex > -1) {
    user.watchlist.splice(existsIndex, 1);
  } else {
    user.watchlist.push(dramaId);
    added = true;
  }

  user.updatedAt = new Date().toISOString();
  await upsertUser(user);

  return res.json({
    message: added ? 'Added to Watchlist' : 'Removed from Watchlist',
    watchlist: user.watchlist,
    added
  });
};

export const getWatchlist = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const dramas = store.dramas.filter(d => user.watchlist.includes(d.id));
  return res.json(dramas);
};

export const updateWatchHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const { dramaId, episodeId, progress, duration } = req.body;
  if (!dramaId || !episodeId) {
    return res.status(400).json({ message: 'Drama ID and Episode ID are required' });
  }

  const existingIndex = store.history.findIndex(
    h => h.userId === req.user!.id && h.dramaId === dramaId
  );

  const now = new Date().toISOString();
  const completed = progress && duration && progress >= duration * 0.9;

  if (existingIndex > -1) {
    store.history[existingIndex].episodeId = episodeId;
    store.history[existingIndex].progress = progress || 0;
    store.history[existingIndex].duration = duration || 0;
    store.history[existingIndex].lastWatched = now;
    store.history[existingIndex].completed = completed;
  } else {
    const newHistory: WatchHistory = {
      id: `hist_${Date.now()}`,
      userId: req.user.id,
      dramaId,
      episodeId,
      progress: progress || 0,
      duration: duration || 0,
      lastWatched: now,
      completed
    };
    store.history.push(newHistory);
  }

  const user = await findUserById(req.user.id);
  if (user) {
    user.updatedAt = now;
    await upsertUser(user);
  }

  store.saveHistory();

  return res.json({ message: 'History updated' });
};

export const getWatchHistory = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const userHistory = store.history
    .filter(h => h.userId === req.user!.id)
    .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime());

  const enriched = userHistory.map(h => {
    const drama = store.dramas.find(d => d.id === h.dramaId);
    const episode = store.episodes.find(e => e.id === h.episodeId);
    return {
      ...h,
      drama,
      episode
    };
  }).filter(h => h.drama !== undefined);

  return res.json(enriched);
};

export const clearWatchHistory = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const { dramaId } = req.body;
  
  if (dramaId) {
    store.history = store.history.filter(
      h => !(h.userId === req.user!.id && h.dramaId === dramaId)
    );
  } else {
    store.history = store.history.filter(h => h.userId !== req.user!.id);
  }

  store.saveHistory();
  return res.json({ message: dramaId ? 'Drama history cleared' : 'All watch history cleared' });
};

export const addRating = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const { dramaId, rating, review } = req.body;
  if (!dramaId || !rating) {
    return res.status(400).json({ message: 'Drama ID and rating are required' });
  }

  const drama = store.dramas.find(d => d.id === dramaId);
  if (!drama) return res.status(404).json({ message: 'Drama not found' });

  const existingIndex = store.ratings.findIndex(r => r.userId === req.user!.id && r.dramaId === dramaId);

  if (existingIndex > -1) {
    store.ratings[existingIndex].rating = Number(rating);
    if (review !== undefined) store.ratings[existingIndex].review = review;
    store.ratings[existingIndex].createdAt = new Date().toISOString();
  } else {
    const newRating: Rating = {
      id: `rev_${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      dramaId,
      rating: Number(rating),
      review: review || '',
      createdAt: new Date().toISOString()
    };
    store.ratings.unshift(newRating);
  }

  const dramaRatings = store.ratings.filter(r => r.dramaId === dramaId);
  const avg = dramaRatings.reduce((acc, r) => acc + r.rating, 0) / dramaRatings.length;

  drama.averageRating = Number(avg.toFixed(1));
  drama.totalRatingsCount = dramaRatings.length;
  drama.updatedAt = new Date().toISOString();

  store.saveRatings();
  store.saveDramas();

  return res.json({
    message: 'Rating submitted successfully',
    averageRating: drama.averageRating,
    totalRatingsCount: drama.totalRatingsCount
  });
};

export const getUserRatings = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const ratings = store.ratings
    .filter(r => r.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const enriched = ratings.map(r => {
    const drama = store.dramas.find(d => d.id === r.dramaId);
    return {
      ...r,
      drama: drama ? { id: drama.id, title: drama.title, poster: drama.poster } : null
    };
  });

  return res.json(enriched);
};

export const getAvailableAvatars = (req: Request, res: Response, next: NextFunction) => {
  try {
    const avatars = Array.from({ length: 20 }, (_, i) => ({
      index: i,
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=avatar_${i}`,
      name: `Avatar ${i + 1}`
    }));
    return res.json({ avatars });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { name, bio, avatarIndex } = req.body;
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatarIndex !== undefined && Number.isInteger(avatarIndex) && avatarIndex >= 0 && avatarIndex < 20) {
      user.avatarIndex = avatarIndex;
      user.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}_${avatarIndex}`;
    }

    user.updatedAt = new Date().toISOString();
    await upsertUser(user);

    const { passwordHash: _, ...userData } = user;
    return res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error updating profile' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    await upsertUser(user);

    return res.json({ message: 'Password changed successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error changing password' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password confirmation required' });
    }

    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    await removeUser(req.user.id);
    
    store.history = store.history.filter(h => h.userId !== req.user!.id);
    store.ratings = store.ratings.filter(r => r.userId !== req.user!.id);
    
    store.saveHistory();
    store.saveRatings();

    return res.json({ message: 'Account deleted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error deleting account' });
  }
};