import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';

export function JobCard({ job, note }) {
  return (
    <Link to={`/jobs/${job._id}`} className="job">
      <h3>{job.title}</h3>
      <p>{job.company} · {job.location} · {job.type}{job.salary ? ` · ${job.salary}` : ''}</p>
      <div className="tags">{(job.skills || []).slice(0, 6).map((s) => <span key={s}>{s}</span>)}</div>
      {note && <p className="note">{note}</p>}
    </Link>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState('');
  const [aiNote, setAiNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = (params = {}) => api.get('/jobs', { params }).then((r) => setJobs(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);

  const plain = (e) => { e.preventDefault(); setAiNote(''); load({ q }); };
  const smart = async () => {
    setBusy(true); setErr(''); setAiNote('');
    try {
      const { data } = await api.post('/ai/search', { query: q });
      setJobs(data.jobs);
      const i = data.interpreted;
      setAiNote(`Searched for ${[i.keywords?.join(', '), i.location, i.type].filter(Boolean).join(' · ')}`);
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <section>
      <div className="hero">
        <h1>Find the role that fits how you actually work.</h1>
        <form onSubmit={plain} className="searchbar">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. remote React developer, internship in Jaipur" />
          <button className="primary">Search</button>
          {user && <button type="button" className="ghost" disabled={busy || !q} onClick={smart}>{busy ? 'Thinking…' : 'Ask AI'}</button>}
        </form>
        {!user && <p className="muted">Sign in to search in plain English with AI.</p>}
        {aiNote && <p className="note">{aiNote}</p>}
      </div>
      {err && <p className="error">{err}</p>}
      <div className="list">
        {jobs.map((j) => <JobCard key={j._id} job={j} />)}
        {!jobs.length && <p className="muted">No jobs match yet. Try fewer words, or check back soon.</p>}
      </div>
    </section>
  );
}
