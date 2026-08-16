import { Request, Response } from 'express';
import { store } from '../config/store.js';
import { AuthRequest } from '../middleware/auth.js';

interface TimeRange {
  start: Date;
  end: Date;
}

function parseTimeRange(range: string): TimeRange {
  const now = new Date();
  let start: Date;
  
  switch (range) {
    case '1h':
      start = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  return { start, end: now };
}

function filterByTimeRange<T extends { timestamp: string }>(items: T[], range: TimeRange): T[] {
  return items.filter(item => {
    const itemTime = new Date(item.timestamp).getTime();
    return itemTime >= range.start.getTime() && itemTime <= range.end.getTime();
  });
}

export const getDashboardStats = (req: Request, res: Response) => {
  const totalDramas = store.dramas.length;
  const totalEpisodes = store.episodes.length;
  const totalUsers = store.users.length;
  const totalViews = store.dramas.reduce((acc, d) => acc + d.views, 0);
  const totalWatchTime = store.history.reduce((acc, h) => acc + (h.progress || 0), 0);

  const topViewed = [...store.dramas]
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map(d => ({ title: d.title, views: d.views, rating: d.averageRating, id: d.id }));

  const genreCount: Record<string, number> = {};
  store.dramas.forEach(d => {
    d.genre.forEach(g => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  const recentUploads = [...store.dramas]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const recentReviews = [...store.ratings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const activeUsers24h = store.users.filter(u => {
    if (!u.lastLoginAt) return false;
    return new Date(u.lastLoginAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
  }).length;

  const activeUsers7d = store.users.filter(u => {
    if (!u.lastLoginAt) return false;
    return new Date(u.lastLoginAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;

  const newUsers24h = store.users.filter(u => {
    return new Date(u.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
  }).length;

  const newUsers7d = store.users.filter(u => {
    return new Date(u.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;

  return res.json({
    totalDramas,
    totalEpisodes,
    totalUsers,
    totalViews,
    totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
    activeUsers24h,
    activeUsers7d,
    newUsers24h,
    newUsers7d,
    topViewed,
    genreDistribution: Object.entries(genreCount).map(([name, value]) => ({ name, value })),
    recentUploads,
    recentReviews
  });
};

export const getRealtimeStats = (req: Request, res: Response) => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  
  const recentHistory = store.history.filter(h => new Date(h.lastWatched).getTime() > oneHourAgo);
  const currentlyWatching = recentHistory.filter(h => !h.completed).length;
  const completedLastHour = recentHistory.filter(h => h.completed).length;
  
  const uniqueViewers = new Set(recentHistory.map(h => h.userId)).size;
  
  return res.json({
    currentlyWatching,
    completedLastHour,
    uniqueViewersLastHour: uniqueViewers,
    totalViewsLastHour: recentHistory.length
  });
};

export const getDramaAnalytics = (req: Request, res: Response) => {
  const { dramaId } = req.params;
  const { range = '7d' } = req.query;
  
  const drama = store.dramas.find(d => d.id === dramaId);
  if (!drama) {
    return res.status(404).json({ message: 'Drama not found' });
  }

  const timeRange = parseTimeRange(range as string);
  const dramaEpisodes = store.episodes.filter(e => e.dramaId === dramaId);
  const episodeIds = dramaEpisodes.map(e => e.id);
  
  const relevantHistory = store.history.filter(h => 
    episodeIds.includes(h.episodeId) &&
    new Date(h.lastWatched) >= timeRange.start &&
    new Date(h.lastWatched) <= timeRange.end
  );

  const episodeStats = dramaEpisodes.map(ep => {
    const epHistory = relevantHistory.filter(h => h.episodeId === ep.id);
    const views = epHistory.length;
    const uniqueViewers = new Set(epHistory.map(h => h.userId)).size;
    const avgProgress = epHistory.length > 0 
      ? epHistory.reduce((acc, h) => acc + (h.progress || 0), 0) / epHistory.length 
      : 0;
    const completionRate = epHistory.length > 0
      ? (epHistory.filter(h => h.completed).length / epHistory.length) * 100
      : 0;

    return {
      episodeId: ep.id,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      views,
      uniqueViewers,
      avgProgress: Math.round(avgProgress),
      completionRate: Math.round(completionRate)
    };
  });

  const totalViews = relevantHistory.length;
  const uniqueViewers = new Set(relevantHistory.map(h => h.userId)).size;
  const avgWatchTime = relevantHistory.length > 0
    ? relevantHistory.reduce((acc, h) => acc + (h.progress || 0), 0) / relevantHistory.length
    : 0;

  const dailyViews: Record<string, number> = {};
  relevantHistory.forEach(h => {
    const date = new Date(h.lastWatched).toISOString().split('T')[0];
    dailyViews[date] = (dailyViews[date] || 0) + 1;
  });

  return res.json({
    dramaId,
    dramaTitle: drama.title,
    timeRange: range,
    totalViews,
    uniqueViewers,
    avgWatchTimeMinutes: Math.round(avgWatchTime / 60),
    episodeStats,
    dailyViews: Object.entries(dailyViews)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({ date, views }))
  });
};

export const getUserEngagement = (req: Request, res: Response) => {
  const { range = '7d' } = req.query;
  const timeRange = parseTimeRange(range as string);
  
  const relevantHistory = store.history.filter(h => 
    new Date(h.lastWatched) >= timeRange.start &&
    new Date(h.lastWatched) <= timeRange.end
  );

  const userStats = store.users.map(user => {
    const userHistory = relevantHistory.filter(h => h.userId === user.id);
    const watchCount = userHistory.length;
    const totalWatchTime = userHistory.reduce((acc, h) => acc + (h.progress || 0), 0);
    const dramasWatched = new Set(userHistory.map(h => h.dramaId)).size;
    const episodesCompleted = userHistory.filter(h => h.completed).length;
    const lastActive = userHistory.length > 0
      ? new Date(Math.max(...userHistory.map(h => new Date(h.lastWatched).getTime()))).toISOString()
      : null;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      watchCount,
      totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
      dramasWatched,
      episodesCompleted,
      lastActive,
      isActive: userHistory.length > 0
    };
  }).filter(u => u.isActive)
    .sort((a, b) => b.totalWatchTimeMinutes - a.totalWatchTimeMinutes);

  const totalActiveUsers = userStats.length;
  const avgWatchTimePerUser = totalActiveUsers > 0
    ? userStats.reduce((acc, u) => acc + u.totalWatchTimeMinutes, 0) / totalActiveUsers
    : 0;
  const avgDramasPerUser = totalActiveUsers > 0
    ? userStats.reduce((acc, u) => acc + u.dramasWatched, 0) / totalActiveUsers
    : 0;

  return res.json({
    timeRange: range,
    totalActiveUsers,
    avgWatchTimePerUserMinutes: Math.round(avgWatchTimePerUser),
    avgDramasPerUser: Math.round(avgDramasPerUser * 10) / 10,
    userStats: userStats.slice(0, 50)
  });
};

export const getContentPerformance = (req: Request, res: Response) => {
  const { range = '7d', limit = '20' } = req.query;
  const timeRange = parseTimeRange(range as string);
  const limitNum = parseInt(limit as string, 10) || 20;
  
  const relevantHistory = store.history.filter(h => 
    new Date(h.lastWatched) >= timeRange.start &&
    new Date(h.lastWatched) <= timeRange.end
  );

  const dramaViews: Record<string, { views: number; watchTime: number; viewers: Set<string>; completions: number }> = {};
  
  relevantHistory.forEach(h => {
    if (!dramaViews[h.dramaId]) {
      dramaViews[h.dramaId] = { views: 0, watchTime: 0, viewers: new Set(), completions: 0 };
    }
    dramaViews[h.dramaId].views++;
    dramaViews[h.dramaId].watchTime += h.progress || 0;
    dramaViews[h.dramaId].viewers.add(h.userId);
    if (h.completed) dramaViews[h.dramaId].completions++;
  });

  const dramaPerformance = Object.entries(dramaViews)
    .map(([dramaId, stats]) => {
      const drama = store.dramas.find(d => d.id === dramaId);
      return {
        dramaId,
        title: drama?.title || 'Unknown',
        poster: drama?.poster || '',
        views: stats.views,
        uniqueViewers: stats.viewers.size,
        totalWatchTimeMinutes: Math.round(stats.watchTime / 60),
        avgWatchTimePerView: stats.views > 0 ? Math.round(stats.watchTime / stats.views / 60) : 0,
        completionRate: stats.views > 0 ? Math.round((stats.completions / stats.views) * 100) : 0
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, limitNum);

  return res.json({
    timeRange: range,
    dramas: dramaPerformance
  });
};

export const getUserRetention = (req: Request, res: Response) => {
  const { range = '30d' } = req.query;
  const timeRange = parseTimeRange(range as string);
  
  const usersInRange = store.users.filter(u => 
    new Date(u.createdAt) >= timeRange.start &&
    new Date(u.createdAt) <= timeRange.end
  );

  const cohorts: Record<string, { users: string[]; active: Record<number, number> }> = {};
  
  usersInRange.forEach(user => {
    const cohortKey = new Date(user.createdAt).toISOString().split('T')[0];
    if (!cohorts[cohortKey]) {
      cohorts[cohortKey] = { users: [], active: {} };
    }
    cohorts[cohortKey].users.push(user.id);
  });

  Object.keys(cohorts).forEach(cohortKey => {
    const cohortUsers = cohorts[cohortKey].users;
    const maxDays = Math.ceil((timeRange.end.getTime() - new Date(cohortKey).getTime()) / (24 * 60 * 60 * 1000));
    
    for (let day = 0; day <= maxDays; day++) {
      const checkDate = new Date(cohortKey);
      checkDate.setDate(checkDate.getDate() + day);
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      let activeCount = 0;
      cohortUsers.forEach(userId => {
        const userHistory = store.history.filter(h => 
          h.userId === userId &&
          new Date(h.lastWatched) >= checkDate &&
          new Date(h.lastWatched) < nextDate
        );
        if (userHistory.length > 0) activeCount++;
      });
      
      cohorts[cohortKey].active[day] = activeCount;
    }
  });

  const retentionData = Object.entries(cohorts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cohortKey, data]) => ({
      cohort: cohortKey,
      totalUsers: data.users.length,
      retention: Object.entries(data.active)
        .map(([day, count]) => ({
          day: parseInt(day),
          percentage: data.users.length > 0 ? Math.round((count / data.users.length) * 100) : 0
        }))
    }));

  return res.json({
    timeRange: range,
    cohorts: retentionData
  });
};

export const getAnalyticsEvents = (req: Request, res: Response) => {
  const { type, startDate, endDate, limit = '1000' } = req.query;
  const limitNum = parseInt(limit as string, 10) || 1000;
  
  let events = store.analytics;
  
  if (type) {
    events = events.filter(e => e.type === type);
  }
  
  if (startDate) {
    events = events.filter(e => new Date(e.timestamp) >= new Date(startDate as string));
  }
  
  if (endDate) {
    events = events.filter(e => new Date(e.timestamp) <= new Date(endDate as string));
  }
  
  events = events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limitNum);
  
  return res.json({ events, total: events.length });
};

export const trackEvent = (req: AuthRequest, res: Response) => {
  try {
    const { type, dramaId, episodeId, metadata } = req.body;
    const user = req.user;
    
    if (!type) {
      return res.status(400).json({ message: 'Event type is required' });
    }
    
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: user?.id,
      dramaId,
      episodeId,
      metadata,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    store.analytics.unshift(event);
    
    if (store.analytics.length > 100000) {
      store.analytics = store.analytics.slice(0, 100000);
    }
    
    store.saveAnalytics();
    
    return res.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to track event' });
  }
};