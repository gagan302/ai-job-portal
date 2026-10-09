import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { JobCard } from './Jobs';

export default function SeekerHub() {
  const { user, saveProfile } = useAuth();
  const [resume, setResume] = useState(user.resumeText || '');
  const [matches, setMatches] = useState([]);
  const [report, setReport] = useState(null);
  const [apps, setApps] = useState([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { api.get('/applications/mine').then((r) => setApps(r.data)).catch(() => {}); }, []);

  const run = (name, fn) => async () => {
    if (!resume.trim()) return setMsg('Paste your resume text first.');
    setBusy(name); setMsg('');
    try { await fn(); } catch (e) { setMsg(errMsg(e)); } finally { setBusy(''); }
  };
  const save = async () => { await saveProfile({ resumeText: resume }); setMsg('Resume saved.'); };
  const optimize = run('opt', async () => setReport((await api.post('/ai/resume/optimize', { resumeText: resume })).data));
  const match = run('match', async () => setMatches((await api.post('/ai/match', { resumeText: resume })).data));

  return (
    <section className="two">
      <div className="panel">
        <h2>Your resume</h2>
        <textarea rows={16} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your resume as plain text" />
        <div className="row">
          <button className="ghost" onClick={save}>Save</button>
          <button className="ghost" onClick={optimize} disabled={!!busy}>{busy === 'opt' ? 'Analysing…' : 'Optimize resume'}</button>
          <button className="primary" onClick={match} disabled={!!busy}>{busy === 'match' ? 'Matching…' : 'Find my matches'}</button>
        </div>
        {msg && <p className="note">{msg}</p>}

        {report && (
          <div className="report">
            <h3>ATS score: {report.score}/100</h3>
            <p>{report.summary}</p>
            <h4>Strengths</h4><ul>{report.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <h4>Gaps</h4><ul>{report.gaps?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <h4>Missing keywords</h4><div className="tags">{report.missingKeywords?.map((s) => <span key={s}>{s}</span>)}</div>
            <h4>Optimized resume</h4>
            <textarea rows={14} readOnly value={report.optimizedResume} />
            <button className="ghost" onClick={() => setResume(report.optimizedResume)}>Use this version</button>
          </div>
        )}
      </div>

      <div>
        <div className="panel">
          <h2>Best matches</h2>
          {!matches.length && <p className="muted">Save your resume, then choose “Find my matches”.</p>}
          <div className="list">{matches.map((m) => <JobCard key={m.jobId} job={m.job} note={`${m.score}% match — ${m.reason}`} />)}</div>
        </div>
        <div className="panel">
          <h2>My applications</h2>
          {!apps.length && <p className="muted">You haven't applied to anything yet.</p>}
          {apps.map((a) => <p key={a._id}>{a.job?.title} at {a.job?.company} — <strong>{a.status}</strong></p>)}
        </div>
      </div>
    </section>
  );
}
