import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  watchlist: string[]; // drama IDs
  createdAt: string;
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
  duration: string; // e.g., "65 mins"
  videoUrl: string;
  subtitles: { language: string; label: string; url: string }[];
  thumbnail: string;
  createdAt: string;
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
  messages: WatchPartyMessage[];
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

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  dramaId: string;
  rating: number; // 1-5
  review: string;
  createdAt: string;
}

export interface WatchHistory {
  id: string;
  userId: string;
  dramaId: string;
  episodeId: string;
  progress: number; // seconds or percentage
  duration: number; // total duration seconds
  lastWatched: string;
}

class Store {
  private usersFile = path.join(DATA_DIR, 'users.json');
  private dramasFile = path.join(DATA_DIR, 'dramas.json');
  private episodesFile = path.join(DATA_DIR, 'episodes.json');
  private ratingsFile = path.join(DATA_DIR, 'ratings.json');
  private historyFile = path.join(DATA_DIR, 'history.json');
  private danmakuFile = path.join(DATA_DIR, 'danmaku.json');
  private bannersFile = path.join(DATA_DIR, 'banners.json');
  private collectionsFile = path.join(DATA_DIR, 'collections.json');

  public users: User[] = [];
  public dramas: Drama[] = [];
  public episodes: Episode[] = [];
  public ratings: Rating[] = [];
  public history: WatchHistory[] = [];
  public danmaku: DanmakuComment[] = [];
  public banners: HeroBanner[] = [];
  public collections: UserCollection[] = [];
  public watchPartyRooms: Map<string, WatchPartyRoom> = new Map();

  constructor() {
    this.loadAll();
    this.seedInitialData();
  }

  private readJSON<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`Error reading ${filePath}`, e);
    }
    return fallback;
  }

  private writeJSON(filePath: string, data: any) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing ${filePath}`, e);
    }
  }

  public loadAll() {
    this.users = this.readJSON(this.usersFile, []);
    this.dramas = this.readJSON(this.dramasFile, []);
    this.episodes = this.readJSON(this.episodesFile, []);
    this.ratings = this.readJSON(this.ratingsFile, []);
    this.history = this.readJSON(this.historyFile, []);
    this.danmaku = this.readJSON(this.danmakuFile, []);
    this.banners = this.readJSON(this.bannersFile, []);
    this.collections = this.readJSON(this.collectionsFile, []);
  }

  public saveUsers() { this.writeJSON(this.usersFile, this.users); }
  public saveDramas() { this.writeJSON(this.dramasFile, this.dramas); }
  public saveEpisodes() { this.writeJSON(this.episodesFile, this.episodes); }
  public saveRatings() { this.writeJSON(this.ratingsFile, this.ratings); }
  public saveHistory() { this.writeJSON(this.historyFile, this.history); }
  public saveDanmaku() { this.writeJSON(this.danmakuFile, this.danmaku); }
  public saveBanners() { this.writeJSON(this.bannersFile, this.banners); }
  public saveCollections() { this.writeJSON(this.collectionsFile, this.collections); }

  private seedInitialData() {
    // Hardcoded Admin Email & Password
    const ADMIN_EMAIL = 'iamzubair708@gmail.com';
    const ADMIN_PASS = 'i@mZura8';

    // Enforce that only iamzubair708@gmail.com gets role 'admin', all other users get role 'user'
    this.users.forEach(u => {
      if (u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        u.role = 'admin';
      } else {
        u.role = 'user';
      }
    });

    // Seed/Update Admin User
    const adminIndex = this.users.findIndex(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    const adminHash = bcrypt.hashSync(ADMIN_PASS, 10);

    if (adminIndex === -1) {
      this.users.unshift({
        id: 'admin_zubair',
        name: 'Zubair (Admin)',
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash: adminHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'admin',
        isBlocked: false,
        watchlist: ['drama_1', 'drama_2'],
        createdAt: new Date().toISOString()
      });
    } else {
      this.users[adminIndex].passwordHash = adminHash;
      this.users[adminIndex].role = 'admin';
    }

    // Seed Regular User if not present
    if (!this.users.some(u => u.email === 'user@kdramabox.com')) {
      const userHash = bcrypt.hashSync('user123', 10);
      this.users.push({
        id: 'user_1',
        name: 'Min-ji Kim',
        email: 'user@kdramabox.com',
        passwordHash: userHash,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        role: 'user',
        isBlocked: false,
        watchlist: ['drama_1', 'drama_3'],
        createdAt: new Date().toISOString()
      });
    }
    // No default sample data auto-inserted.
  }
}

export const store = new Store();



