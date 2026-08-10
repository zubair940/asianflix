import { Request, Response } from 'express';
import { store } from '../config/store.js';

export const getDashboardStats = (req: Request, res: Response) => {
  const totalDramas = store.dramas.length;
  const totalEpisodes = store.episodes.length;
  const totalUsers = store.users.length;
  const totalViews = store.dramas.reduce((acc, d) => acc + d.views, 0);

  // Top viewed dramas for chart
  const topViewed = [...store.dramas]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(d => ({ title: d.title, views: d.views, rating: d.averageRating }));

  // Genre distribution
  const genreCount: Record<string, number> = {};
  store.dramas.forEach(d => {
    d.genre.forEach(g => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  const recentUploads = [...store.dramas]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentReviews = [...store.ratings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return res.json({
    totalDramas,
    totalEpisodes,
    totalUsers,
    totalViews,
    topViewed,
    genreDistribution: Object.entries(genreCount).map(([name, value]) => ({ name, value })),
    recentUploads,
    recentReviews
  });
};

export const getAllUsers = (req: Request, res: Response) => {
  const users = store.users.map(({ passwordHash: _, ...u }) => {
    // Calculate user total watch time from watch history
    const userHistory = store.history.filter(h => h.userId === u.id);
    const watchSeconds = userHistory.reduce((acc, h) => acc + (h.progress || 0), 0);
    const watchMinutes = Math.round(watchSeconds / 60);

    return {
      ...u,
      totalWatchMinutes: watchMinutes
    };
  });

  return res.json(users);
};

export const toggleBlockUser = (req: Request, res: Response) => {
  const { id } = req.params;
  const user = store.users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ message: 'Cannot block admin accounts' });
  }

  user.isBlocked = !user.isBlocked;
  store.saveUsers();

  return res.json({
    message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
    isBlocked: user.isBlocked
  });
};

export const deleteUser = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (store.users[index].role === 'admin') {
    return res.status(400).json({ message: 'Cannot delete admin accounts' });
  }

  store.users.splice(index, 1);
  // Clean up user history and ratings
  store.history = store.history.filter(h => h.userId !== id);
  store.ratings = store.ratings.filter(r => r.userId !== id);

  store.saveUsers();
  store.saveHistory();
  store.saveRatings();

  return res.json({ message: 'User account deleted successfully' });
};

export const deleteReview = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.ratings.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Review not found' });
  }

  const dramaId = store.ratings[index].dramaId;
  store.ratings.splice(index, 1);

  // Recalculate drama rating
  const drama = store.dramas.find(d => d.id === dramaId);
  if (drama) {
    const dramaRatings = store.ratings.filter(r => r.dramaId === dramaId);
    if (dramaRatings.length > 0) {
      const avg = dramaRatings.reduce((acc, r) => acc + r.rating, 0) / dramaRatings.length;
      drama.averageRating = Number(avg.toFixed(1));
      drama.totalRatingsCount = dramaRatings.length;
    } else {
      drama.averageRating = 5.0;
      drama.totalRatingsCount = 0;
    }
    store.saveDramas();
  }

  store.saveRatings();

  return res.json({ message: 'Review deleted successfully' });
};
