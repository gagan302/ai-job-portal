import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sign, protect } from '../middleware/auth.js';

const r = Router();
const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role,
  company: u.company, skills: u.skills, resumeText: u.resumeText,
});

r.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, company } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({
      name, email, company,
      role: role === 'recruiter' ? 'recruiter' : 'seeker',
      password: await bcrypt.hash(password, 10),
    });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

r.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
      return res.status(401).json({ message: 'Incorrect email or password' });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

r.get('/me', protect, async (req, res, next) => {
  try { res.json(publicUser(await User.findById(req.user.id))); } catch (e) { next(e); }
});

r.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, company, skills, resumeText } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(company !== undefined && { company }),
        ...(Array.isArray(skills) && { skills }), ...(resumeText !== undefined && { resumeText }) },
      { new: true });
    res.json(publicUser(user));
  } catch (e) { next(e); }
});

export default r;
