import { Request, Response } from 'express';
import { isMongoHealthy, getCollection, replaceOne, insertOne, deleteOne } from '../config/mongodb/mongoStore.js';
import { store, Episode } from '../config/store.js';

export async function getEpisodesFromMongo(): Promise<Episode[] | null> {
  if (!(await isMongoHealthy())) return null;
  try {
    const collection = await getCollection<Episode>('episodes');
    const docs = await collection.find({}).toArray();
    return docs as unknown as Episode[];
  } catch {
    return null;
  }
}

export async function getEpisodesForDrama(dramaId: string): Promise<Episode[]> {
  let episodes = await getEpisodesFromMongo();
  if (!episodes) episodes = [...store.episodes];
  return episodes.filter(e => e.dramaId === dramaId).sort((a, b) => a.episodeNumber - b.episodeNumber);
}

export async function deleteEpisodesForDrama(dramaId: string) {
  store.episodes = store.episodes.filter(e => e.dramaId !== dramaId);
  store.saveEpisodes();
  if (await isMongoHealthy()) {
    try {
      const collection = await getCollection<Episode>('episodes');
      await collection.deleteMany({ dramaId });
    } catch {
      // ignore
    }
  }
}

async function persistEpisode(episode: Episode) {
  const idx = store.episodes.findIndex(e => e.id === episode.id);
  if (idx >= 0) store.episodes[idx] = episode;
  else store.episodes.push(episode);
  store.saveEpisodes();

  if (await isMongoHealthy()) {
    try {
      await replaceOne<Episode>('episodes', { id: episode.id }, episode);
    } catch (err) {
      console.error('Failed to persist episode to MongoDB:', (err as Error).message);
    }
  }
}

async function findEpisodeById(id: string): Promise<Episode | null> {
  if (await isMongoHealthy()) {
    try {
      const collection = await getCollection<Episode>('episodes');
      const ep = await collection.findOne({ id });
      if (ep) return ep as unknown as Episode;
    } catch {
      // fall through
    }
  }
  return store.episodes.find(e => e.id === id) || null;
}

export const getAllEpisodes = async (req: Request, res: Response) => {
  try {
    const { dramaId, search } = req.query;
    let episodes = await getEpisodesFromMongo();
    if (!episodes) episodes = [...store.episodes];

    if (dramaId) {
      episodes = episodes.filter(e => e.dramaId === String(dramaId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      episodes = episodes.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.episodeNumber.toString() === q
      );
    }

    episodes.sort((a, b) => {
      if (a.dramaId === b.dramaId) {
        return a.episodeNumber - b.episodeNumber;
      }
      return a.dramaId.localeCompare(b.dramaId);
    });

    return res.json(episodes);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error fetching episodes'
    });
  }
};

export const getEpisodesByDrama = async (req: Request, res: Response) => {
  try {
    const { dramaId } = req.params;
    const episodes = await getEpisodesForDrama(dramaId);
    return res.json(episodes);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error fetching episodes'
    });
  }
};

export const createEpisode = async (req: Request, res: Response) => {
  try {
    const {
      dramaId,
      episodeNumber,
      title,
      duration,
      videoUrl,
      subtitles,
      thumbnail,
      servers,
      skipIntroStart,
      skipIntroEnd,
      skipOutroStart
    } = req.body;

    if (!dramaId || !episodeNumber || !title || !videoUrl) {
      return res.status(400).json({
        message:
          'Drama ID, episode number, title, and video URL are required'
      });
    }

    const dramaExists = store.dramas.some(d => d.id === dramaId) || (await findDramaInMongo(dramaId));
    if (!dramaExists) {
      return res.status(404).json({
        message: 'Associated Drama not found'
      });
    }

    const newEpisode: Episode = {
      id: `ep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      dramaId,
      episodeNumber: Number(episodeNumber),
      title,
      duration: duration || '60 mins',
      videoUrl,
      subtitles: Array.isArray(subtitles) ? subtitles : [],
      thumbnail: thumbnail || store.dramas.find(d => d.id === dramaId)?.poster || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(Array.isArray(servers) ? { servers } : {}),
      ...(skipIntroStart !== undefined
        ? { skipIntroStart: Number(skipIntroStart) }
        : {}),
      ...(skipIntroEnd !== undefined
        ? { skipIntroEnd: Number(skipIntroEnd) }
        : {}),
      ...(skipOutroStart !== undefined
        ? { skipOutroStart: Number(skipOutroStart) }
        : {})
    };

    await persistEpisode(newEpisode);

    return res.status(201).json({
      message: 'Episode added successfully',
      episode: newEpisode
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error creating episode'
    });
  }
};

export const updateEpisode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const episode = await findEpisodeById(id);

    if (!episode) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    const {
      dramaId,
      episodeNumber,
      title,
      duration,
      videoUrl,
      subtitles,
      thumbnail,
      servers,
      skipIntroStart,
      skipIntroEnd,
      skipOutroStart
    } = req.body;

    if (dramaId) episode.dramaId = dramaId;
    if (episodeNumber !== undefined) episode.episodeNumber = Number(episodeNumber);
    if (title) episode.title = title;
    if (duration) episode.duration = duration;
    if (videoUrl) episode.videoUrl = videoUrl;
    if (Array.isArray(subtitles)) episode.subtitles = subtitles;
    if (thumbnail) episode.thumbnail = thumbnail;
    if (Array.isArray(servers)) episode.servers = servers;

    if (skipIntroStart !== undefined) episode.skipIntroStart = Number(skipIntroStart);
    if (skipIntroEnd !== undefined) episode.skipIntroEnd = Number(skipIntroEnd);
    if (skipOutroStart !== undefined) episode.skipOutroStart = Number(skipOutroStart);

    episode.updatedAt = new Date().toISOString();
    await persistEpisode(episode);

    return res.json({
      message: 'Episode updated successfully',
      episode
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error updating episode'
    });
  }
};

export const replaceEpisodeVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        message: 'New video URL is required'
      });
    }

    const episode = await findEpisodeById(id);
    if (!episode) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    episode.videoUrl = videoUrl;
    episode.updatedAt = new Date().toISOString();
    await persistEpisode(episode);

    return res.json({
      message: 'Video replaced successfully',
      episode
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error replacing episode video'
    });
  }
};

export const updateEpisodeSubtitle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subtitles } = req.body;

    if (!Array.isArray(subtitles)) {
      return res.status(400).json({
        message: 'Subtitles must be an array'
      });
    }

    const episode = await findEpisodeById(id);
    if (!episode) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    episode.subtitles = subtitles;
    episode.updatedAt = new Date().toISOString();
    await persistEpisode(episode);

    return res.json({
      message: 'Subtitles updated successfully',
      episode
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error updating subtitles'
    });
  }
};

export const deleteEpisode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const episode = await findEpisodeById(id);

    if (!episode) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    const idx = store.episodes.findIndex(e => e.id === id);
    if (idx >= 0) {
      store.episodes.splice(idx, 1);
      store.saveEpisodes();
    }
    if (await isMongoHealthy()) {
      try {
        const collection = await getCollection<Episode>('episodes');
        await collection.deleteOne({ id });
      } catch {
        // ignore
      }
    }

    return res.json({
      message: 'Episode deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error deleting episode'
    });
  }
};

export const reorderEpisodes = async (req: Request, res: Response) => {
  try {
    const { dramaId, episodeIds } = req.body;

    if (!dramaId || !Array.isArray(episodeIds)) {
      return res.status(400).json({
        message: 'dramaId and episodeIds array are required'
      });
    }

    for (let index = 0; index < episodeIds.length; index++) {
      const ep = store.episodes.find(e => e.id === episodeIds[index] && e.dramaId === dramaId);
      if (ep) {
        ep.episodeNumber = index + 1;
      }
      if (await isMongoHealthy()) {
        try {
          const collection = await getCollection<Episode>('episodes');
          await collection.updateOne(
            { id: episodeIds[index], dramaId },
            { $set: { episodeNumber: index + 1 } }
          );
        } catch {
          // ignore
        }
      }
    }
    store.saveEpisodes();

    const updatedEpisodes = await getEpisodesForDrama(dramaId);

    return res.json({
      message: 'Episodes reordered successfully',
      episodes: updatedEpisodes
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error reordering episodes'
    });
  }
};

async function findDramaInMongo(dramaId: string): Promise<boolean> {
  if (!(await isMongoHealthy())) return false;
  try {
    const collection = await getCollection('dramas');
    const drama = await collection.findOne({ id: dramaId });
    return Boolean(drama);
  } catch {
    return false;
  }
}