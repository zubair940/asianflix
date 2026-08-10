import { Request, Response } from 'express';
import { store, DanmakuComment, HeroBanner, UserCollection, Episode, ServerMirror } from '../config/store.js';

// --- Danmaku / Timed Comments ---
export const getDanmaku = (req: Request, res: Response) => {
  const { episodeId } = req.params;
  const list = store.danmaku
    .filter(d => d.episodeId === episodeId)
    .sort((a, b) => a.timestampSec - b.timestampSec);
  return res.json(list);
};

export const postDanmaku = (req: Request, res: Response) => {
  try {
    const { episodeId, text, timestampSec, color } = req.body;
    const user = (req as any).user;

    if (!episodeId || !text || timestampSec === undefined) {
      return res.status(400).json({ message: 'Episode ID, comment text, and timestamp are required' });
    }

    const comment: DanmakuComment = {
      id: `danmaku_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      episodeId,
      userId: user?.id || 'anon',
      userName: user?.name || 'Anonymous Watcher',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      text: text.trim().slice(0, 150),
      timestampSec: Number(timestampSec),
      color: color || '#00C2FF',
      createdAt: new Date().toISOString()
    };

    store.danmaku.push(comment);
    store.saveDanmaku();

    return res.status(201).json(comment);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Error posting live comment' });
  }
};

export const deleteDanmaku = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = store.danmaku.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    store.danmaku.splice(index, 1);
    store.saveDanmaku();
    return res.json({ message: 'Danmaku comment deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Error deleting comment' });
  }
};

export const getAllDanmakuAdmin = (req: Request, res: Response) => {
  return res.json(store.danmaku);
};

// --- Watch Party Rooms ---
export const createWatchParty = (req: Request, res: Response) => {
  try {
    const { dramaId, episodeId, roomName } = req.body;
    const user = (req as any).user;

    const drama = store.dramas.find(d => d.id === dramaId);
    const episode = store.episodes.find(e => e.id === episodeId);

    if (!drama || !episode) {
      return res.status(404).json({ message: 'Drama or episode not found' });
    }

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = `room_${Date.now()}`;

    const room = {
      id: roomId,
      roomCode,
      dramaId,
      episodeId,
      hostName: user?.name || 'Host',
      hostUserId: user?.id || 'anon',
      roomName: roomName || `${drama.title} Ep ${episode.episodeNumber} Party`,
      currentTime: 0,
      isPlaying: true,
      participantsCount: 1,
      messages: [
        {
          id: `msg_1`,
          userId: 'system',
          userName: 'KDramaBox Bot',
          userAvatar: '/logo.svg',
          text: `🎉 Watch party created! Share code [${roomCode}] with friends to watch together.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      createdAt: new Date().toISOString()
    };

    store.watchPartyRooms.set(roomCode, room);

    return res.status(201).json(room);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Error creating Watch Party' });
  }
};

export const getWatchParty = (req: Request, res: Response) => {
  const { code } = req.params;
  const room = store.watchPartyRooms.get(code.toUpperCase());
  if (!room) {
    return res.status(404).json({ message: 'Watch party room not found or expired' });
  }
  return res.json(room);
};

export const sendWatchPartyMessage = (req: Request, res: Response) => {
  const { code } = req.params;
  const { text, currentTime, isPlaying } = req.body;
  const user = (req as any).user;

  const room = store.watchPartyRooms.get(code.toUpperCase());
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  if (currentTime !== undefined) room.currentTime = Number(currentTime);
  if (isPlaying !== undefined) room.isPlaying = Boolean(isPlaying);

  if (text) {
    const msg = {
      id: `msg_${Date.now()}`,
      userId: user?.id || 'guest',
      userName: user?.name || 'Guest Watcher',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    room.messages.push(msg);
    if (room.messages.length > 100) room.messages.shift();
  }

  return res.json(room);
};

// --- Hero Banners ---
export const getHeroBanners = (req: Request, res: Response) => {
  return res.json(store.banners);
};

export const saveHeroBanner = (req: Request, res: Response) => {
  try {
    const { dramaId, title, tagline, badge, imageUrl, buttonText, active } = req.body;
    const newBanner: HeroBanner = {
      id: `banner_${Date.now()}`,
      dramaId: dramaId || '',
      title: title || 'Featured Drama',
      tagline: tagline || 'Stream now on KDramaBox',
      badge: badge || 'EXCLUSIVE',
      imageUrl: imageUrl || '',
      buttonText: buttonText || 'Watch Free HD',
      active: active !== undefined ? active : true
    };
    store.banners.push(newBanner);
    store.saveBanners();
    return res.status(201).json(newBanner);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Error saving hero banner' });
  }
};

export const deleteHeroBanner = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.banners.findIndex(b => b.id === id);
  if (index !== -1) {
    store.banners.splice(index, 1);
    store.saveBanners();
  }
  return res.json({ message: 'Banner removed' });
};

// --- User Collections ---
export const getCollections = (req: Request, res: Response) => {
  return res.json(store.collections);
};

export const createCollection = (req: Request, res: Response) => {
  try {
    const { title, description, dramaIds, isPublic } = req.body;
    const user = (req as any).user;

    const newColl: UserCollection = {
      id: `coll_${Date.now()}`,
      userId: user?.id || 'anon',
      userName: user?.name || 'Drama Fan',
      title: title || 'My Favorite Drama Binge List',
      description: description || '',
      dramaIds: Array.isArray(dramaIds) ? dramaIds : [],
      isPublic: isPublic !== undefined ? isPublic : true,
      createdAt: new Date().toISOString()
    };

    store.collections.push(newColl);
    store.saveCollections();
    return res.status(201).json(newColl);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Error creating collection' });
  }
};

export const deleteCollection = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.collections.findIndex(c => c.id === id);
  if (index !== -1) {
    store.collections.splice(index, 1);
    store.saveCollections();
  }
  return res.json({ message: 'Collection deleted' });
};

// --- Admin Bulk Episode Importer ---
export const bulkGenerateEpisodes = (req: Request, res: Response) => {
  try {
    const { dramaId, count, startEpNum, duration, defaultVideoUrl, serverNames } = req.body;

    if (!dramaId || !count) {
      return res.status(400).json({ message: 'dramaId and total count are required' });
    }

    const drama = store.dramas.find(d => d.id === dramaId);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    const startNum = Number(startEpNum) || 1;
    const totalCount = Number(count);
    const createdEpisodes: Episode[] = [];

    const defaultUrl = defaultVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    for (let i = 0; i < totalCount; i++) {
      const epNum = startNum + i;
      
      // Multi-Server Mirrors setup
      const servers: ServerMirror[] = [
        {
          id: `srv_${Date.now()}_1_${i}`,
          name: 'Server 1 (VIP Fast HD)',
          url: defaultUrl,
          quality: '1080p',
          audioType: 'Subbed',
          pingMs: 18,
          isPrimary: true
        },
        {
          id: `srv_${Date.now()}_2_${i}`,
          name: 'Server 2 (NetMirror HLS)',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          quality: '720p',
          audioType: 'Subbed',
          pingMs: 32,
          isPrimary: false
        },
        {
          id: `srv_${Date.now()}_3_${i}`,
          name: 'Server 3 (MovieBox Alt)',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          quality: '480p',
          audioType: 'English Dub',
          pingMs: 45,
          isPrimary: false
        }
      ];

      const newEp: Episode = {
        id: `ep_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
        dramaId,
        episodeNumber: epNum,
        title: `Episode ${epNum}`,
        duration: duration || '65 mins',
        videoUrl: defaultUrl,
        subtitles: [
          { language: 'en', label: 'English', url: '/sample-sub-en.vtt' },
          { language: 'kr', label: 'Korean', url: '/sample-sub-kr.vtt' }
        ],
        thumbnail: drama.backdrop || drama.poster,
        createdAt: new Date().toISOString(),
        servers,
        skipIntroStart: 0,
        skipIntroEnd: 85,
        skipOutroStart: 3400
      };

      store.episodes.push(newEp);
      createdEpisodes.push(newEp);
    }

    store.saveEpisodes();

    return res.status(201).json({
      message: `Successfully bulk generated ${createdEpisodes.length} episodes for ${drama.title}`,
      episodes: createdEpisodes
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Error bulk generating episodes' });
  }
};
