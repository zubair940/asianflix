export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarIndex: number;
  bio: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  watchlist: string[];
  watchHistory: WatchHistory[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  totalWatchMinutes?: number;
  vipBadge?: string;
  collections?: UserCollection[];
}

export interface Drama {
  id: string;
  title: string;
  titleKR: string;
  description: string;
  poster: string;
  backdrop: string;
  genre: string[];
  category?: string;
  cast: string[];
  director: string;
  releaseYear: number;
  averageRating: number;
  totalRatingsCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  episodeCount?: number;
}

export interface Subtitle {
  language: string;
  label: string;
  url: string;
}

export interface ServerMirror {
  id: string;
  name: string;
  url: string;
  quality: string;
  audioType: 'Subbed' | 'English Dub' | 'Hindi Dub' | 'Korean Raw';
  pingMs?: number;
  isPrimary?: boolean;
}

export interface Episode {
  id: string;
  dramaId: string;
  episodeNumber: number;
  title: string;
  duration: string;
  videoUrl: string;
  subtitles: Subtitle[];
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  servers?: ServerMirror[];
  skipIntroStart?: number;
  skipIntroEnd?: number;
  skipOutroStart?: number;
}

export interface DanmakuComment {
  id: string;
  episodeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestampSec: number;
  color?: string;
  createdAt: string;
}

export interface WatchPartyMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  time: string;
}

export interface WatchPartyRoom {
  id: string;
  roomCode: string;
  dramaId: string;
  episodeId: string;
  hostName: string;
  hostUserId: string;
  roomName: string;
  currentTime: number;
  isPlaying: boolean;
  participantsCount: number;
  createdAt: string;
}

export interface UserCollection {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  description: string;
  dramaIds: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface HeroBanner {
  id: string;
  dramaId: string;
  title: string;
  tagline: string;
  badge: string;
  imageUrl: string;
  buttonText: string;
  active: boolean;
}

export interface ActorProfile {
  name: string;
  koreanName?: string;
  photoUrl: string;
  bio: string;
  birthDate?: string;
  dramaIds: string[];
  fanCount: number;
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  dramaId: string;
  rating: number;
  review: string;
  createdAt: string;
}

export interface WatchHistory {
  id: string;
  userId: string;
  dramaId: string;
  episodeId: string;
  progress: number;
  duration: number;
  lastWatched: string;
  completed: boolean;
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  dramaId: string;
  episodeId: string;
  progress: number;
  duration: number;
  lastWatched: string;
  drama?: Drama;
  episode?: Episode;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface DashboardStats {
  totalDramas: number;
  totalEpisodes: number;
  totalUsers: number;
  totalViews: number;
  totalWatchTimeMinutes: number;
  activeUsers24h: number;
  activeUsers7d: number;
  newUsers24h: number;
  newUsers7d: number;
  topViewed: { title: string; views: number; rating: number; id: string }[];
  genreDistribution: { name: string; value: number }[];
  recentUploads: Drama[];
  recentReviews: Rating[];
  totalDanmakuComments?: number;
  activeWatchParties?: number;
  serverBandwidthGb?: number;
}

export interface RealtimeStats {
  currentlyWatching: number;
  completedLastHour: number;
  uniqueViewersLastHour: number;
  totalViewsLastHour: number;
}

export interface DramaAnalytics {
  dramaId: string;
  dramaTitle: string;
  timeRange: string;
  totalViews: number;
  uniqueViewers: number;
  avgWatchTimeMinutes: number;
  episodeStats: EpisodeAnalytics[];
  dailyViews: { date: string; views: number }[];
}

export interface EpisodeAnalytics {
  episodeId: string;
  episodeNumber: number;
  title: string;
  views: number;
  uniqueViewers: number;
  avgProgress: number;
  completionRate: number;
}

export interface UserEngagement {
  timeRange: string;
  totalActiveUsers: number;
  avgWatchTimePerUserMinutes: number;
  avgDramasPerUser: number;
  userStats: UserEngagementStat[];
}

export interface UserEngagementStat {
  userId: string;
  name: string;
  email: string;
  watchCount: number;
  totalWatchTimeMinutes: number;
  dramasWatched: number;
  episodesCompleted: number;
  lastActive: string | null;
  isActive: boolean;
}

export interface ContentPerformance {
  timeRange: string;
  dramas: DramaPerformance[];
}

export interface DramaPerformance {
  dramaId: string;
  title: string;
  poster: string;
  views: number;
  uniqueViewers: number;
  totalWatchTimeMinutes: number;
  avgWatchTimePerView: number;
  completionRate: number;
}

export interface UserRetention {
  timeRange: string;
  cohorts: CohortRetention[];
}

export interface CohortRetention {
  cohort: string;
  totalUsers: number;
  retention: { day: number; percentage: number }[];
}

export interface AnalyticsEvent {
  id: string;
  type: 'view' | 'watch' | 'complete' | 'search' | 'login' | 'register';
  userId?: string;
  dramaId?: string;
  episodeId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export interface Avatar {
  index: number;
  url: string;
  name: string;
}

export interface DramaDetailResponse {
  drama: Drama;
  episodes: Episode[];
  reviews: Rating[];
  related: Drama[];
}