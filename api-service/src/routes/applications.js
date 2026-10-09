import { Router } from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { protect, requireRole } from '../middleware/auth.js';

const r = Router();
r.use(protect);

r.post('/', requireRole('seeker'), async (req, res, next) => {
  try {
    const { jobId, coverLetter } = req.body;
    if (!(await Job.exists({ _id: jobId }))) return res.status(404).json({ message: 'Job not found' });
    const app = await Application.create({ job: jobId, applicant: req.user.id, coverLetter });
    res.status(201).json(app);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'You already applied to this job' });
    next(e);
  }
});

r.get('/mine', requireRole('seeker'), async (req, res, next) => {
  try { res.json(await Application.find({ applicant: req.user.id }).populate('job').sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});

r.get('/job/:jobId', requireRole('recruiter'), async (req, res, next) => {
  try {
    if (!(await Job.exists({ _id: req.params.jobId, recruiter: req.user.id })))
      return res.status(404).json({ message: 'Job not found' });
    res.json(await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email skills resumeText').sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});

r.patch('/:id/status', requireRole('recruiter'), async (req, res, next) => {
  try {
    if (!['applied', 'shortlisted', 'rejected', 'hired'].includes(req.body.status))
      return res.status(400).json({ message: 'Invalid status' });
    const app = await Application.findById(req.params.id).populate('job');
    if (!app || String(app.job.recruiter) !== req.user.id) return res.status(404).json({ message: 'Application not found' });
    app.status = req.body.status;
    await app.save();
    res.json(app);
  } catch (e) { next(e); }
});

export default r;
