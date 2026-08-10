import { Request, Response } from 'express';
import { store, Drama } from '../config/store.js';

export const getAllDramas = (req: Request, res: Response) => {
  try {
    let results = [...store.dramas];

    // Search query (title, Korean title, cast, director, genre)
    const q = req.query.q as string;
    if (q) {
      const term = q.toLowerCase();
      results = results.filter(d =>
        d.title.toLowerCase().includes(term) ||
        d.titleKR.includes(term) ||
        d.director.toLowerCase().includes(term) ||
        d.genre.some(g => g.toLowerCase().includes(term)) ||
        d.cast.some(c => c.toLowerCase().includes(term))
      );
    }

    // Category filter
    const category = req.query.category as string;
    if (category && category !== 'All' && category !== 'All Categories') {
      results = results.filter(d => (d.category || 'K-Drama').toLowerCase() === category.toLowerCase());
    }

    // Genre filter
    const genre = req.query.genre as string;
    if (genre && genre !== 'All') {
      results = results.filter(d => d.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    // Release Year filter
    const year = req.query.year ? parseInt(req.query.year as string) : null;
    if (year) {
      results = results.filter(d => d.releaseYear === year);
    }

    // Rating filter
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : null;
    if (minRating) {
      results = results.filter(d => d.averageRating >= minRating);
    }

    // Sorting
    const sort = req.query.sort as string; // 'latest', 'views', 'rating', 'a-z'
    if (sort === 'views') {
      results.sort((a, b) => b.views - a.views);
    } else if (sort === 'rating') {
      results.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === 'a-z') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: latest created / released
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.json({
      total: results.length,
      dramas: results
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching dramas' });
  }
};

export const getTrendingDramas = (req: Request, res: Response) => {
  const trending = [...store.dramas].sort((a, b) => b.views - a.views).slice(0, 10);
  return res.json(trending);
};

export const getLatestDramas = (req: Request, res: Response) => {
  const latest = [...store.dramas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  return res.json(latest);
};

export const getDramasByGenre = (req: Request, res: Response) => {
  const { genre } = req.params;
  const filtered = store.dramas.filter(d => d.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
  return res.json(filtered);
};

export const getDramaById = (req: Request, res: Response) => {
  const { id } = req.params;
  const drama = store.dramas.find(d => d.id === id);

  if (!drama) {
    return res.status(404).json({ message: 'Drama not found' });
  }

  // Increment view count automatically when fetched
  drama.views += 1;
  store.saveDramas();

  // Get episodes belonging to drama
  const episodes = store.episodes
    .filter(e => e.dramaId === id)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  // Get user reviews for this drama
  const reviews = store.ratings
    .filter(r => r.dramaId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Related dramas (same primary genre)
  const primaryGenre = drama.genre[0];
  const related = store.dramas
    .filter(d => d.id !== id && d.genre.some(g => g === primaryGenre))
    .slice(0, 6);

  return res.json({
    drama,
    episodes,
    reviews,
    related
  });
};

export const createDrama = (req: Request, res: Response) => {
  try {
    const { title, titleKR, description, poster, backdrop, genre, category, cast, director, releaseYear } = req.body;

    if (!title || !description || !poster) {
      return res.status(400).json({ message: 'Title, description, and poster are required' });
    }

    const newDrama: Drama = {
      id: `drama_${Date.now()}`,
      title,
      titleKR: titleKR || '',
      description,
      poster,
      backdrop: backdrop || poster,
      genre: Array.isArray(genre) ? genre : (typeof genre === 'string' ? genre.split(',').map(s => s.trim()) : ['Romance']),
      category: category || 'K-Drama',
      cast: Array.isArray(cast) ? cast : (typeof cast === 'string' ? cast.split(',').map(s => s.trim()) : []),
      director: director || 'Unknown',
      releaseYear: Number(releaseYear) || new Date().getFullYear(),
      averageRating: 5.0,
      totalRatingsCount: 1,
      views: 0,
      createdAt: new Date().toISOString()
    };

    store.dramas.unshift(newDrama);
    store.saveDramas();

    return res.status(201).json({
      message: 'Drama created successfully',
      drama: newDrama
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error creating drama' });
  }
};

export const updateDrama = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = store.dramas.findIndex(d => d.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    const drama = store.dramas[index];
    const { title, titleKR, description, poster, backdrop, genre, category, cast, director, releaseYear } = req.body;

    if (title) drama.title = title;
    if (titleKR !== undefined) drama.titleKR = titleKR;
    if (description) drama.description = description;
    if (poster) drama.poster = poster;
    if (backdrop) drama.backdrop = backdrop;
    if (genre) drama.genre = Array.isArray(genre) ? genre : genre.split(',').map((s: string) => s.trim());
    if (category) drama.category = category;
    if (cast) drama.cast = Array.isArray(cast) ? cast : cast.split(',').map((s: string) => s.trim());
    if (director) drama.director = director;
    if (releaseYear) drama.releaseYear = Number(releaseYear);

    store.saveDramas();

    return res.json({
      message: 'Drama updated successfully',
      drama
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating drama' });
  }
};

export const deleteDrama = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.dramas.findIndex(d => d.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Drama not found' });
  }

  store.dramas.splice(index, 1);
  // Remove associated episodes
  store.episodes = store.episodes.filter(e => e.dramaId !== id);
  // Remove associated ratings
  store.ratings = store.ratings.filter(r => r.dramaId !== id);

  store.saveDramas();
  store.saveEpisodes();
  store.saveRatings();

  return res.json({ message: 'Drama and related content deleted successfully' });
};
