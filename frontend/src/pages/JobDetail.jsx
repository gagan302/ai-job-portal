import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [letter, setLetter] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get(`/jobs/${id}`).then((r) => setJob(r.data)).catch((e) => setMsg(errMsg(e))); }, [id]);

  const draft = async () => {
    if (!user.resumeText) return setMsg('Add your resume text in My workspace first.');
    setBusy(true); setMsg('');
    try { setLetter((await api.post('/ai/cover-letter', { resumeText: user.resumeText, jobId: id })).data.coverLetter); }
    catch (e) { setMsg(errMsg(e)); } finally { setBusy(false); }
  };
  const apply = async () => {
    try { await api.post('/applications', { jobId: id, coverLetter: letter }); setMsg('Application sent.'); }
    catch (e) { setMsg(errMsg(e)); }
  };

  if (!job) return <p className="muted pad">{msg || 'Loading…'}</p>;
  return (
    <article className="panel">
      <h1>{job.title}</h1>
      <p className="muted">{job.company} · {job.location} · {job.type}{job.salary ? ` · ${job.salary}` : ''}</p>
      <div className="tags">{job.skills.map((s) => <span key={s}>{s}</span>)}</div>
      <p className="pre">{job.description}</p>
      {user?.role === 'seeker' ? (
        <>
          <div className="row">
            <button className="ghost" onClick={draft} disabled={busy}>{busy ? 'Writing…' : 'Draft cover letter with AI'}</button>
            <button className="primary" onClick={apply}>Apply</button>
          </div>
          {letter && <textarea rows={12} value={letter} onChange={(e) => setLetter(e.target.value)} />}
        </>
      ) : !user ? <p><Link to="/login">Sign in</Link> as a job seeker to apply.</p> : null}
      {msg && <p className="note">{msg}</p>}
    </article>
  );
}
