import { Request, Response } from 'express';
import { store, Episode } from '../config/store.js';
import fs from 'fs';
import path from 'path';

// Helper to remove local uploaded files safely when replaced or deleted
const removeLocalFile = (urlStr: string) => {
  if (!urlStr) return;
  try {
    if (urlStr.includes('/uploads/')) {
      const filename = urlStr.split('/uploads/').pop()?.split('?')[0];
      if (filename) {
        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted old uploaded file: ${filename}`);
        }
      }
    }
  } catch (err) {
    console.error('Error deleting local file:', err);
  }
};

export const getAllEpisodes = (req: Request, res: Response) => {
  try {
    const { dramaId, search } = req.query;
    let list = [...store.episodes];

    if (dramaId) {
      list = list.filter(e => e.dramaId === String(dramaId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(e => e.title.toLowerCase().includes(q) || e.episodeNumber.toString() === q);
    }

    // Sort by dramaId and episodeNumber
    list.sort((a, b) => {
      if (a.dramaId === b.dramaId) {
        return a.episodeNumber - b.episodeNumber;
      }
      return a.dramaId.localeCompare(b.dramaId);
    });

    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching episodes' });
  }
};

export const getEpisodesByDrama = (req: Request, res: Response) => {
  const { dramaId } = req.params;
  const episodes = store.episodes
    .filter(e => e.dramaId === dramaId)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  return res.json(episodes);
};

export const createEpisode = (req: Request, res: Response) => {
  try {
    const { dramaId, episodeNumber, title, duration, videoUrl, subtitles, thumbnail } = req.body;

    if (!dramaId || !episodeNumber || !title || !videoUrl) {
      return res.status(400).json({ message: 'Drama ID, episode number, title, and video URL are required' });
    }

    const drama = store.dramas.find(d => d.id === dramaId);
    if (!drama) {
      return res.status(404).json({ message: 'Associated Drama not found' });
    }

    const newEpisode: Episode = {
      id: `ep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      dramaId,
      episodeNumber: Number(episodeNumber),
      title,
      duration: duration || '60 mins',
      videoUrl,
      subtitles: Array.isArray(subtitles) ? subtitles : [],
      thumbnail: thumbnail || drama.poster,
      createdAt: new Date().toISOString()
    };

    store.episodes.push(newEpisode);
    store.saveEpisodes();

    return res.status(201).json({
      message: 'Episode added successfully',
      episode: newEpisode
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error creating episode' });
  }
};

export const updateEpisode = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = store.episodes.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    const ep = store.episodes[index];
    const { episodeNumber, title, duration, videoUrl, subtitles, thumbnail, dramaId } = req.body;

    if (dramaId) ep.dramaId = dramaId;
    if (episodeNumber !== undefined) ep.episodeNumber = Number(episodeNumber);
    if (title) ep.title = title;
    if (duration) ep.duration = duration;
    
    if (videoUrl && videoUrl !== ep.videoUrl) {
      // Clean up old file if replaced via edit modal
      removeLocalFile(ep.videoUrl);
      ep.videoUrl = videoUrl;
    }
    
    if (subtitles) ep.subtitles = Array.isArray(subtitles) ? subtitles : ep.subtitles;
    if (thumbnail) ep.thumbnail = thumbnail;

    store.saveEpisodes();

    return res.json({
      message: 'Episode updated successfully',
      episode: ep
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating episode' });
  }
};

export const replaceEpisodeVideo = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'New video URL is required' });
    }

    const ep = store.episodes.find(e => e.id === id);
    if (!ep) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    // Clean up old video file from disk if local
    if (ep.videoUrl && ep.videoUrl !== videoUrl) {
      removeLocalFile(ep.videoUrl);
    }

    ep.videoUrl = videoUrl;
    store.saveEpisodes();

    return res.json({
      message: 'Video replaced successfully',
      episode: ep
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error replacing episode video' });
  }
};

export const updateEpisodeSubtitle = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subtitles } = req.body;

    const ep = store.episodes.find(e => e.id === id);
    if (!ep) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    if (Array.isArray(subtitles)) {
      ep.subtitles = subtitles;
      store.saveEpisodes();
    }

    return res.json({
      message: 'Subtitles updated successfully',
      episode: ep
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating subtitles' });
  }
};

export const deleteEpisode = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = store.episodes.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    const ep = store.episodes[index];

    // Clean up video file & subtitle files if local
    if (ep.videoUrl) {
      removeLocalFile(ep.videoUrl);
    }
    if (ep.subtitles && Array.isArray(ep.subtitles)) {
      ep.subtitles.forEach(s => removeLocalFile(s.url));
    }

    store.episodes.splice(index, 1);
    store.saveEpisodes();

    return res.json({ message: 'Episode deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error deleting episode' });
  }
};

export const reorderEpisodes = (req: Request, res: Response) => {
  try {
    const { dramaId, episodeIds } = req.body;

    if (!dramaId || !Array.isArray(episodeIds)) {
      return res.status(400).json({ message: 'dramaId and episodeIds array are required' });
    }

    // Reorder and update episode numbers sequentially starting at 1
    episodeIds.forEach((epId: string, index: number) => {
      const ep = store.episodes.find(e => e.id === epId && e.dramaId === dramaId);
      if (ep) {
        ep.episodeNumber = index + 1;
      }
    });

    store.saveEpisodes();

    const updatedEpisodes = store.episodes
      .filter(e => e.dramaId === dramaId)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);

    return res.json({
      message: 'Episodes reordered successfully',
      episodes: updatedEpisodes
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error reordering episodes' });
  }
};

