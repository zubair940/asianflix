export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  watchlist: string[];
  createdAt: string;
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
  category?: string; // e.g. 'K-Drama', 'C-Drama', 'Pakistani Drama', 'Turkish Drama', 'J-Drama', 'Thai Drama'
  cast: string[];
  director: string;
  releaseYear: number;
  averageRating: number;
  totalRatingsCount: number;
  views: number;
  createdAt: string;
}

export interface Subtitle {
  language: string;
  label: string;
  url: string;
}

export interface ServerMirror {
  id: string;
  name: string; // e.g. "Server Alpha (VIP 1080p)", "Server Beta (HLS Mirror)"
  url: string;
  quality: string; // "1080p", "720p", "480p", "Auto"
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
  servers?: ServerMirror[];
  skipIntroStart?: number; // seconds e.g. 0
  skipIntroEnd?: number;   // seconds e.g. 85
  skipOutroStart?: number; // seconds e.g. 3300
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

export interface WatchHistoryItem {
  id: string;
  userId: string;
  dramaId: string;
  episodeId: string;
  progress: number; // seconds
  duration: number; // seconds
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
  topViewed: { title: string; views: number; rating: number }[];
  genreDistribution: { name: string; value: number }[];
  recentUploads: Drama[];
  recentReviews: Rating[];
  totalDanmakuComments?: number;
  activeWatchParties?: number;
  serverBandwidthGb?: number;
}
