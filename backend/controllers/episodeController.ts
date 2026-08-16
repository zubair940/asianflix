import { Request, Response } from 'express';
import { getCollection } from '../config/mongodb/mongoStore.js';
import { Episode } from '../config/store.js';

const episodesCollection = () => getCollection<Episode>('episodes');

export const getAllEpisodes = async (req: Request, res: Response) => {
  try {
    const { dramaId, search } = req.query;
    const collection = await episodesCollection();

    const filter: Record<string, any> = {};

    if (dramaId) {
      filter.dramaId = String(dramaId);
    }

    let episodes = await collection.find(filter).toArray();

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
    const collection = await episodesCollection();

    const episodes = await collection
      .find({ dramaId })
      .sort({ episodeNumber: 1 })
      .toArray();

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

    const dramasCollection = await getCollection('dramas');
    const drama = await dramasCollection.findOne({ id: dramaId });

    if (!drama) {
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
      thumbnail: thumbnail || (drama as any).poster,
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

    const collection = await episodesCollection();
    await collection.insertOne(newEpisode);

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
    const collection = await episodesCollection();

    const episode = await collection.findOne({ id });

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

    const updates: Partial<Episode> = {};

    if (dramaId) updates.dramaId = dramaId;

    if (episodeNumber !== undefined) {
      updates.episodeNumber = Number(episodeNumber);
    }

    if (title) updates.title = title;
    if (duration) updates.duration = duration;
    if (videoUrl) updates.videoUrl = videoUrl;
    if (Array.isArray(subtitles)) updates.subtitles = subtitles;
    if (thumbnail) updates.thumbnail = thumbnail;
    if (Array.isArray(servers)) updates.servers = servers;

    if (skipIntroStart !== undefined) {
      updates.skipIntroStart = Number(skipIntroStart);
    }

    if (skipIntroEnd !== undefined) {
      updates.skipIntroEnd = Number(skipIntroEnd);
    }

    if (skipOutroStart !== undefined) {
      updates.skipOutroStart = Number(skipOutroStart);
    }

    updates.updatedAt = new Date().toISOString();
    await collection.updateOne(
      { id },
      { $set: updates }
    );

    const updatedEpisode = await collection.findOne({ id });

    return res.json({
      message: 'Episode updated successfully',
      episode: updatedEpisode
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error updating episode'
    });
  }
};

export const replaceEpisodeVideo = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        message: 'New video URL is required'
      });
    }

    const collection = await episodesCollection();
    const episode = await collection.findOne({ id });

    if (!episode) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    await collection.updateOne(
      { id },
      {
        $set: {
          videoUrl
        }
      }
    );

    const updatedEpisode = await collection.findOne({ id });

    return res.json({
      message: 'Video replaced successfully',
      episode: updatedEpisode
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error replacing episode video'
    });
  }
};

export const updateEpisodeSubtitle = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { subtitles } = req.body;

    if (!Array.isArray(subtitles)) {
      return res.status(400).json({
        message: 'Subtitles must be an array'
      });
    }

    const collection = await episodesCollection();
    const episode = await collection.findOne({ id });

    if (!episode) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    await collection.updateOne(
      { id },
      {
        $set: {
          subtitles
        }
      }
    );

    const updatedEpisode = await collection.findOne({ id });

    return res.json({
      message: 'Subtitles updated successfully',
      episode: updatedEpisode
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
    const collection = await episodesCollection();

    const episode = await collection.findOne({ id });

    if (!episode) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    await collection.deleteOne({ id });

    return res.json({
      message: 'Episode deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Error deleting episode'
    });
  }
};

export const reorderEpisodes = async (
  req: Request,
  res: Response
) => {
  try {
    const { dramaId, episodeIds } = req.body;

    if (!dramaId || !Array.isArray(episodeIds)) {
      return res.status(400).json({
        message: 'dramaId and episodeIds array are required'
      });
    }

    const collection = await episodesCollection();

    for (let index = 0; index < episodeIds.length; index++) {
      await collection.updateOne(
        {
          id: episodeIds[index],
          dramaId
        },
        {
          $set: {
            episodeNumber: index + 1
          }
        }
      );
    }

    const updatedEpisodes = await collection
      .find({ dramaId })
      .sort({ episodeNumber: 1 })
      .toArray();

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