# Hirewise – AI-Powered Job Portal (Microservices, MERN + Gemini)

Full-stack job portal with separate experiences for **job seekers** and **recruiters**.

**Stack:** MongoDB · Express.js · React.js (Vite) · Node.js · Google Gemini API · JWT · REST · Docker

## Architecture

```
Browser ──► nginx (frontend container, :80)
              ├── /api/ai/*  ──► ai-service  (:5001) ── Gemini API
              │                      └── reads jobs from api-service
              └── /api/*     ──► api-service (:5000) ── MongoDB
```

| Service | Responsibility |
|---|---|
| `api-service` | Auth (JWT, bcrypt), role-based access (seeker / recruiter), jobs, applications |
| `ai-service` | Resume optimization, job matching, natural-language search, cover letters (Gemini) |
| `frontend` | React SPA served by nginx, which also acts as the gateway |
| `mongo` | Data store |

Both services verify the same JWT, so AI endpoints are only reachable by signed-in users.

## Features
- Register as job seeker or recruiter; JWT auth with role guards on client and server
- Recruiters: post/delete jobs, review applicants, set status (shortlisted / rejected / hired)
- Seekers: browse and search, apply, track applications
- AI: resume optimizer (ATS score, gaps, keywords, rewrite), job matching with scores, "Ask AI" plain-English search, personalized cover letters

## Run with Docker
```bash
cp .env.example .env        # set JWT_SECRET and GEMINI_API_KEY
docker compose up --build -d
# open http://localhost
```
Get a Gemini key at https://aistudio.google.com/app/apikey

## Run locally without Docker
```bash
# terminal 1 (needs MongoDB on localhost)
cd api-service && npm install && MONGO_URI=mongodb://127.0.0.1:27017/jobportal JWT_SECRET=dev npm run dev
# terminal 2
cd ai-service && npm install && JWT_SECRET=dev GEMINI_API_KEY=xxxx npm run dev
# terminal 3
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## API summary
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET/PUT | `/api/auth/me`, `/api/auth/profile` | signed in |
| GET | `/api/jobs?q=&location=&type=`, `/api/jobs/:id` | public |
| POST/DELETE, GET `/mine` | `/api/jobs` | recruiter |
| POST, GET `/mine` | `/api/applications` | seeker |
| GET, PATCH | `/api/applications/job/:jobId`, `/api/applications/:id/status` | recruiter |
| POST | `/api/ai/resume/optimize`, `/match`, `/search`, `/cover-letter` | signed in |

## Deploy
**Single VM (simplest):** create an Ubuntu VM (AWS EC2, DigitalOcean, Oracle free tier), open ports 80/443, run
`curl -fsSL https://get.docker.com | sh`, clone this repo, create `.env`, then `docker compose up --build -d`.
Add a domain and HTTPS with Caddy or nginx + certbot in front of port 80.

**Split free-tier deploy:** MongoDB Atlas + `api-service` and `ai-service` on Render/Railway
(env: `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `API_SERVICE_URL`) + frontend on Vercel/Netlify, rewriting `/api/ai/*` and `/api/*` to the services.

## Push to GitHub
Create an empty repo on GitHub, then: `./push-to-github.sh https://github.com/<you>/ai-job-portal.git`
