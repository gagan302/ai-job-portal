import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { generateText, generateJSON } from './gemini.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 30 }));

const API = process.env.API_SERVICE_URL || 'http://localhost:5000';

const auth = (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(t, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Not authenticated' }); }
};

const fetchJobs = async (qs = '') => {
  const r = await fetch(`${API}/api/jobs${qs}`);
  if (!r.ok) throw new Error('Could not load jobs');
  return r.json();
};
const clip = (s = '', n = 6000) => String(s).slice(0, n);

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ai-service' }));

// 1. Resume optimization (optionally tailored to a job)
app.post('/api/ai/resume/optimize', auth, async (req, res, next) => {
  try {
    const { resumeText, jobId } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'Paste your resume text first' });
    let jobBlock = '';
    if (jobId) {
      const r = await fetch(`${API}/api/jobs/${jobId}`);
      if (r.ok) {
        const j = await r.json();
        jobBlock = `Target job: ${j.title} at ${j.company}\n${clip(j.description, 3000)}\nSkills: ${(j.skills || []).join(', ')}`;
      }
    }
    const result = await generateJSON(`You are an expert resume coach and ATS specialist.
Analyse the resume${jobBlock ? ' against the target job' : ''}. Return JSON with keys:
"score" (0-100 ATS readiness), "summary" (2 sentences), "strengths" (string[]), "gaps" (string[]),
"missingKeywords" (string[]), "improvedBullets" (array of {"original","improved"}), "optimizedResume" (full rewritten resume as plain text).
Never invent employers, degrees or numbers that are not in the original.

RESUME:
${clip(resumeText)}

${jobBlock}`);
    res.json(result);
  } catch (e) { next(e); }
});

// 2. Intelligent job matching
app.post('/api/ai/match', auth, async (req, res, next) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'Add your resume text to get matches' });
    const jobs = await fetchJobs('?limit=40');
    if (!jobs.length) return res.json([]);
    const compact = jobs.map((j) => ({ id: j._id, title: j.title, company: j.company, skills: j.skills, desc: clip(j.description, 400) }));
    const ranked = await generateJSON(`Match this candidate to the jobs. Return a JSON array of up to 8 items sorted best first:
{"jobId": string, "score": 0-100, "reason": one sentence, "missingSkills": string[]}
Only use jobId values from the list.

CANDIDATE RESUME:
${clip(resumeText, 4000)}

JOBS:
${JSON.stringify(compact)}`);
    const byId = Object.fromEntries(jobs.map((j) => [j._id, j]));
    res.json((Array.isArray(ranked) ? ranked : []).filter((m) => byId[m.jobId]).map((m) => ({ ...m, job: byId[m.jobId] })));
  } catch (e) { next(e); }
});

// 3. AI-powered natural-language search
app.post('/api/ai/search', auth, async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Type what you are looking for' });
    const f = await generateJSON(`Convert this job search into JSON: {"keywords": string[] (max 5 core role/skill terms), "location": string|null, "type": "Full-time"|"Part-time"|"Contract"|"Internship"|null}.
Search: "${clip(query, 300)}"`);
    const qs = new URLSearchParams();
    if (f.keywords?.length) qs.set('q', f.keywords.join(' '));
    if (f.location) qs.set('location', f.location);
    if (f.type) qs.set('type', f.type);
    res.json({ interpreted: f, jobs: await fetchJobs(`?${qs}`) });
  } catch (e) { next(e); }
});

// 4. Personalized cover letter
app.post('/api/ai/cover-letter', auth, async (req, res, next) => {
  try {
    const { resumeText, jobId, tone = 'professional' } = req.body;
    if (!resumeText || !jobId) return res.status(400).json({ message: 'Resume text and job are required' });
    const r = await fetch(`${API}/api/jobs/${jobId}`);
    if (!r.ok) return res.status(404).json({ message: 'Job not found' });
    const j = await r.json();
    const letter = await generateText(`Write a concise (under 280 words), ${clip(tone, 30)} cover letter for this job using only facts in the resume.
Do not invent experience. No placeholders other than [Your Name] at the end.

JOB: ${j.title} at ${j.company} (${j.location})
${clip(j.description, 3000)}

RESUME:
${clip(resumeText, 4000)}`);
    res.json({ coverLetter: letter.trim() });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'AI request failed. Try again.' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`ai-service on ${PORT}`));
