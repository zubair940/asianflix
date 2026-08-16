import { Request, Response } from 'express';
import { store, Drama } from '../config/store.js';
import { getCollection } from '../config/mongodb/mongoStore.js';

const dramasCollection = () => getCollection<Drama>('dramas');

export const getAllDramas = async (req: Request, res: Response) => {
  try {
    const collection = await dramasCollection();
    const q = req.query.q as string;
    const category = req.query.category as string;
    const genre = req.query.genre as string;
    const year = req.query.year ? parseInt(req.query.year as string) : null;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : null;
    const sort = req.query.sort as string;

    let results = await collection.find({}).toArray();

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

    return res.json({ total: results.length, dramas: results });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching dramas' });
  }
};

export const getTrendingDramas = async (req: Request, res: Response) => {
  const collection = await dramasCollection();
  const results = await collection.find({}).sort({ views: -1 }).limit(10).toArray();
  return res.json(results);
};

export const getLatestDramas = async (req: Request, res: Response) => {
  const collection = await dramasCollection();
  const results = await collection.find({}).sort({ createdAt: -1 }).limit(10).toArray();
  return res.json(results);
};

export const getDramasByGenre = async (req: Request, res: Response) => {
  const collection = await dramasCollection();
  const results = await collection.find({ genre: { $regex: `^${req.params.genre}$`, $options: 'i' } }).toArray();
  return res.json(results);
};

export const getDramaById = async (req: Request, res: Response) => {
  try {
    const collection = await dramasCollection();
    const drama = await collection.findOne({ id: req.params.id });
    if (!drama) return res.status(404).json({ message: 'Drama not found' });

    await collection.updateOne({ id: req.params.id }, { $inc: { views: 1 } });
    drama.views += 1;

    const episodes = (await (await import('../config/mongodb/mongoStore.js')).getCollection<any>('episodes')).find({ dramaId: req.params.id }).sort({ episodeNumber: 1 }).toArray();
    const reviews = store.ratings.filter(r => r.dramaId === req.params.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const primaryGenre = drama.genre[0];
    const related = await collection.find({ id: { $ne: req.params.id }, genre: primaryGenre }).limit(6).toArray();

    return res.json({ drama, episodes: await episodes, reviews, related });
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

    await (await dramasCollection()).insertOne(newDrama);
    return res.status(201).json({ message: 'Drama created successfully', drama: newDrama });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error creating drama' });
  }
};

export const updateDrama = async (req: Request, res: Response) => {
  try {
    const collection = await dramasCollection();
    const drama = await collection.findOne({ id: req.params.id });
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
    await collection.replaceOne({ id: req.params.id }, drama);
    return res.json({ message: 'Drama updated successfully', drama });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating drama' });
  }
};

export const deleteDrama = async (req: Request, res: Response) => {
  try {
    const collection = await dramasCollection();
    const result = await collection.deleteOne({ id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Drama not found' });
    const episodes = await getCollection<any>('episodes');
    await episodes.deleteMany({ dramaId: req.params.id });
    store.ratings = store.ratings.filter(r => r.dramaId !== req.params.id);
    store.saveRatings();
    return res.json({ message: 'Drama and related content deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error deleting drama' });
  }
};
