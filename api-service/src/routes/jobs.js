import { Router } from 'express';
import Job from '../models/Job.js';
import { protect, requireRole } from '../middleware/auth.js';

const r = Router();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Public list with keyword / location / type filters
r.get('/', async (req, res, next) => {
  try {
    const { q, location, type, limit = 50 } = req.query;
    const filter = {};
    if (q) {
      const words = String(q).split(/\s+/).filter(Boolean).map(esc);
      filter.$or = words.flatMap((w) => [
        { title: new RegExp(w, 'i') }, { company: new RegExp(w, 'i') },
        { description: new RegExp(w, 'i') }, { skills: new RegExp(w, 'i') },
      ]);
    }
    if (location) filter.location = new RegExp(esc(String(location)), 'i');
    if (type) filter.type = type;
    res.json(await Job.find(filter).sort({ createdAt: -1 }).limit(Math.min(+limit || 50, 100)));
  } catch (e) { next(e); }
});

r.get('/mine', protect, requireRole('recruiter'), async (req, res, next) => {
  try { res.json(await Job.find({ recruiter: req.user.id }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    job ? res.json(job) : res.status(404).json({ message: 'Job not found' });
  } catch (e) { next(e); }
});

r.post('/', protect, requireRole('recruiter'), async (req, res, next) => {
  try {
    const { title, company, location, type, salary, description, skills } = req.body;
    if (!title || !company || !description) return res.status(400).json({ message: 'Title, company and description are required' });
    const job = await Job.create({
      title, company, location, type, salary, description,
      skills: Array.isArray(skills) ? skills : String(skills || '').split(',').map((s) => s.trim()).filter(Boolean),
      recruiter: req.user.id,
    });
    res.status(201).json(job);
  } catch (e) { next(e); }
});

r.delete('/:id', protect, requireRole('recruiter'), async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.user.id });
    job ? res.json({ deleted: true }) : res.status(404).json({ message: 'Job not found' });
  } catch (e) { next(e); }
});

export default r;
