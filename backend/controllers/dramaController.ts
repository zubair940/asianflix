import { Request, Response } from 'express';
import { store, Drama } from '../config/store.js';
import { isMongoHealthy, getCollection, replaceOne, insertOne, deleteOne } from '../config/mongodb/mongoStore.js';
import { getEpisodesForDrama, deleteEpisodesForDrama, getEpisodeCountMap } from './episodeController.js';

function withEpisodeCount(dramas: Drama[], counts: Map<string, number>): Drama[] {
  return dramas.map(d => ({ ...d, episodeCount: counts.get(d.id) || 0 }));
}

async function getDramasFromMongo(): Promise<Drama[] | null> {
  if (!(await isMongoHealthy())) return null;
  try {
    const collection = await getCollection<Drama>('dramas');
    const docs = await collection.find({}).toArray();
    return docs as unknown as Drama[];
  } catch {
    return null;
  }
}

async function persistDrama(drama: Drama) {
  const idx = store.dramas.findIndex(d => d.id === drama.id);
  if (idx >= 0) store.dramas[idx] = drama;
  else store.dramas.push(drama);
  store.saveDramas();

  if (await isMongoHealthy()) {
    try {
      await replaceOne<Drama>('dramas', { id: drama.id }, drama);
    } catch (err) {
      console.error('Failed to persist drama to MongoDB:', (err as Error).message);
    }
  }
}

export const getHomeData = async (req: Request, res: Response) => {
  try {
    let dramas = await getDramasFromMongo();
    if (!dramas) dramas = [...store.dramas];

    const counts = await getEpisodeCountMap();
    dramas = withEpisodeCount(dramas, counts);

    const trending = [...dramas].sort((a, b) => b.views - a.views).slice(0, 10);
    const latest = [...dramas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return res.json({ trending, latest, all: dramas });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching home data' });
  }
};

export const getAllDramas = async (req: Request, res: Response) => {
  try {
    let results = await getDramasFromMongo();
    if (!results) results = [...store.dramas];

    const q = req.query.q as string;
    const category = req.query.category as string;
    const genre = req.query.genre as string;
    const year = req.query.year ? parseInt(req.query.year as string) : null;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : null;
    const sort = req.query.sort as string;

    if (q) {
      const term = q.toLowerCase();
      results = results.filter(d => d.title.toLowerCase().includes(term) || d.titleKR.toLowerCase().includes(term) || d.director.toLowerCase().includes(term) || d.genre.some(g => g.toLowerCase().includes(term)) || d.cast.some(c => c.toLowerCase().includes(term)));
    }
    if (category && category !== 'All' && category !== 'All Categories') results = results.filter(d => (d.category || 'K-Drama').toLowerCase() === category.toLowerCase());
    if (genre && genre !== 'All') results = results.filter(d => d.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    if (year) results = results.filter(d => d.releaseYear === year);
    if (minRating) results = results.filter(d => d.averageRating >= minRating);

    if (sort === 'views') results.sort((a,b) => b.views - a.views);
    else if (sort === 'rating') results.sort((a,b) => b.averageRating - a.averageRating);
    else if (sort === 'a-z') results.sort((a,b) => a.title.localeCompare(b.title));
    else results.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    results = withEpisodeCount(results, await getEpisodeCountMap());

    return res.json({ total: results.length, dramas: results });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching dramas' });
  }
};

export const getTrendingDramas = async (req: Request, res: Response) => {
  try {
    let results = await getDramasFromMongo();
    if (!results) results = [...store.dramas];
    results = results.sort((a, b) => b.views - a.views).slice(0, 10);
    results = withEpisodeCount(results, await getEpisodeCountMap());
    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching trending dramas' });
  }
};

export const getLatestDramas = async (req: Request, res: Response) => {
  try {
    let results = await getDramasFromMongo();
    if (!results) results = [...store.dramas];
    results = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    results = withEpisodeCount(results, await getEpisodeCountMap());
    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching latest dramas' });
  }
};

export const getDramasByGenre = async (req: Request, res: Response) => {
  try {
    const genre = (req.params.genre || '').toLowerCase();
    let results = await getDramasFromMongo();
    if (!results) results = [...store.dramas];
    results = results.filter(d => d.genre.some(g => g.toLowerCase() === genre));
    results = withEpisodeCount(results, await getEpisodeCountMap());
    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching dramas by genre' });
  }
};

export const getDramaById = async (req: Request, res: Response) => {
  try {
    let drama = null;
    if (await isMongoHealthy()) {
      try {
        const collection = await getCollection<Drama>('dramas');
        drama = await collection.findOne({ id: req.params.id });
      } catch {
        drama = null;
      }
    }
    if (!drama) {
      drama = store.dramas.find(d => d.id === req.params.id) || null;
    }
    if (!drama) return res.status(404).json({ message: 'Drama not found' });

    drama.views += 1;
    const dramaCopy = { ...drama };
    if (await isMongoHealthy()) {
      try {
        const collection = await getCollection<Drama>('dramas');
        await collection.updateOne({ id: req.params.id }, { $inc: { views: 1 } });
        dramaCopy.views = drama.views;
      } catch {
        // ignore
      }
    }
    const idx = store.dramas.findIndex(d => d.id === req.params.id);
    if (idx >= 0) {
      store.dramas[idx].views = drama.views;
      store.saveDramas();
    }

    const episodes = await getEpisodesForDrama(req.params.id);
    const reviews = store.ratings.filter(r => r.dramaId === req.params.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const primaryGenre = drama.genre[0];
    let related: Drama[] = [];
    if (primaryGenre) {
      let all = await getDramasFromMongo();
      if (!all) all = [...store.dramas];
      related = all.filter(d => d.id !== req.params.id && d.genre.includes(primaryGenre)).slice(0, 6);
    }
    const counts = await getEpisodeCountMap();
    const enrichedDrama = { ...drama, episodeCount: counts.get(drama.id) || 0 };
    related = withEpisodeCount(related, counts);

    return res.json({ drama: enrichedDrama, episodes, reviews, related });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching drama' });
  }
};

export const createDrama = async (req: Request, res: Response) => {
  try {
    const { title, titleKR, description, poster, backdrop, genre, category, cast, director, releaseYear } = req.body;
    if (!title || !description || !poster) return res.status(400).json({ message: 'Title, description, and poster are required' });

    const newDrama: Drama = {
      id: `drama_${Date.now()}`,
      title, titleKR: titleKR || '', description, poster, backdrop: backdrop || poster,
      genre: Array.isArray(genre) ? genre : (typeof genre === 'string' ? genre.split(',').map((s:string) => s.trim()) : ['Romance']),
      category: category || 'K-Drama',
      cast: Array.isArray(cast) ? cast : (typeof cast === 'string' ? cast.split(',').map((s:string) => s.trim()) : []),
      director: director || 'Unknown', releaseYear: Number(releaseYear) || new Date().getFullYear(),
      averageRating: 5.0, totalRatingsCount: 1, views: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };

    await persistDrama(newDrama);
    return res.status(201).json({ message: 'Drama created successfully', drama: newDrama });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error creating drama' });
  }
};

export const updateDrama = async (req: Request, res: Response) => {
  try {
    let drama = null;
    if (await isMongoHealthy()) {
      try {
        const collection = await getCollection<Drama>('dramas');
        drama = await collection.findOne({ id: req.params.id });
      } catch {
        drama = null;
      }
    }
    if (!drama) {
      drama = store.dramas.find(d => d.id === req.params.id) || null;
    }
    if (!drama) return res.status(404).json({ message: 'Drama not found' });
    const { title, titleKR, description, poster, backdrop, genre, category, cast, director, releaseYear } = req.body;
    if (title) drama.title = title;
    if (titleKR !== undefined) drama.titleKR = titleKR;
    if (description) drama.description = description;
    if (poster) drama.poster = poster;
    if (backdrop) drama.backdrop = backdrop;
    if (genre) drama.genre = Array.isArray(genre) ? genre : genre.split(',').map((s:string) => s.trim());
    if (category) drama.category = category;
    if (cast) drama.cast = Array.isArray(cast) ? cast : cast.split(',').map((s:string) => s.trim());
    if (director) drama.director = director;
    if (releaseYear) drama.releaseYear = Number(releaseYear);
    drama.updatedAt = new Date().toISOString();
    await persistDrama(drama);
    return res.json({ message: 'Drama updated successfully', drama });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating drama' });
  }
};

export const deleteDrama = async (req: Request, res: Response) => {
  try {
    const idx = store.dramas.findIndex(d => d.id === req.params.id);
    if (idx === -1 && await isMongoHealthy()) {
      const collection = await getCollection<Drama>('dramas');
      const result = await collection.deleteOne({ id: req.params.id });
      if (!result.deletedCount) return res.status(404).json({ message: 'Drama not found' });
    } else if (idx === -1) {
      return res.status(404).json({ message: 'Drama not found' });
    } else {
      store.dramas.splice(idx, 1);
      store.saveDramas();
    }
    await deleteEpisodesForDrama(req.params.id);
    store.ratings = store.ratings.filter(r => r.dramaId !== req.params.id);
    store.saveRatings();
    return res.json({ message: 'Drama and related content deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error deleting drama' });
  }
};