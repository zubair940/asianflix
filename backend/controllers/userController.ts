import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { store, Rating, WatchHistory } from '../config/store.js';

export const toggleWatchlist = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const { dramaId } = req.body;
  if (!dramaId) return res.status(400).json({ message: 'Drama ID is required' });

  const userIndex = store.users.findIndex(u => u.id === req.user!.id);
  if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

  const user = store.users[userIndex];
  const existsIndex = user.watchlist.indexOf(dramaId);

  let added = false;
  if (existsIndex > -1) {
    user.watchlist.splice(existsIndex, 1);
  } else {
    user.watchlist.push(dramaId);
    added = true;
  }

  store.saveUsers();

  return res.json({
    message: added ? 'Added to Watchlist' : 'Removed from Watchlist',
    watchlist: user.watchlist,
    added
  });
};

export const getWatchlist = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const user = store.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const dramas = store.dramas.filter(d => user.watchlist.includes(d.id));
  return res.json(dramas);
};

export const updateWatchHistory = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const { dramaId, episodeId, progress, duration } = req.body;
  if (!dramaId || !episodeId) {
    return res.status(400).json({ message: 'Drama ID and Episode ID are required' });
  }

  const existingIndex = store.history.findIndex(
    h => h.userId === req.user!.id && h.dramaId === dramaId
  );

  const now = new Date().toISOString();

  if (existingIndex > -1) {
    store.history[existingIndex].episodeId = episodeId;
    store.history[existingIndex].progress = progress || 0;
    store.history[existingIndex].duration = duration || 0;
    store.history[existingIndex].lastWatched = now;
  } else {
    const newHistory: WatchHistory = {
      id: `hist_${Date.now()}`,
      userId: req.user.id,
      dramaId,
      episodeId,
      progress: progress || 0,
      duration: duration || 0,
      lastWatched: now
    };
    store.history.push(newHistory);
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

export const addRating = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  const { dramaId, rating, review } = req.body;
  if (!dramaId || !rating) {
    return res.status(400).json({ message: 'Drama ID and rating are required' });
  }

  const drama = store.dramas.find(d => d.id === dramaId);
  if (!drama) return res.status(404).json({ message: 'Drama not found' });

  // Check if user already rated this drama
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

  // Recalculate drama average rating
  const dramaRatings = store.ratings.filter(r => r.dramaId === dramaId);
  const avg = dramaRatings.reduce((acc, r) => acc + r.rating, 0) / dramaRatings.length;

  drama.averageRating = Number(avg.toFixed(1));
  drama.totalRatingsCount = dramaRatings.length;

  store.saveRatings();
  store.saveDramas();

  return res.json({
    message: 'Rating submitted successfully',
    averageRating: drama.averageRating,
    totalRatingsCount: drama.totalRatingsCount
  });
};
