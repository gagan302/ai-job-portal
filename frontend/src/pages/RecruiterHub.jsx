import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';

const blank = { title: '', location: 'Remote', type: 'Full-time', salary: '', skills: '', description: '' };

export default function RecruiterHub() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(null);
  const [apps, setApps] = useState([]);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const load = () => api.get('/jobs/mine').then((r) => setJobs(r.data));
  useEffect(() => { load(); }, []);

  const post = async (e) => {
    e.preventDefault(); setMsg('');
    try { await api.post('/jobs', { ...f, company: user.company || user.name }); setF(blank); setMsg('Job posted.'); load(); }
    catch (x) { setMsg(errMsg(x)); }
  };
  const remove = async (id) => { await api.delete(`/jobs/${id}`); if (open === id) setOpen(null); load(); };
  const view = async (id) => { setOpen(id); setApps((await api.get(`/applications/job/${id}`)).data); };
  const status = async (id, s) => { await api.patch(`/applications/${id}/status`, { status: s }); view(open); };

  return (
    <section className="two">
      <form className="panel" onSubmit={post}>
        <h2>Post a job</h2>
        <label>Title<input value={f.title} onChange={set('title')} required /></label>
        <label>Location<input value={f.location} onChange={set('location')} /></label>
        <label>Type<select value={f.type} onChange={set('type')}>{['Full-time', 'Part-time', 'Contract', 'Internship'].map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Salary<input value={f.salary} onChange={set('salary')} placeholder="e.g. ₹8–12 LPA" /></label>
        <label>Skills (comma separated)<input value={f.skills} onChange={set('skills')} /></label>
        <label>Description<textarea rows={8} value={f.description} onChange={set('description')} required /></label>
        <button className="primary">Publish job</button>
        {msg && <p className="note">{msg}</p>}
      </form>

      <div>
        <div className="panel">
          <h2>Your jobs</h2>
          {!jobs.length && <p className="muted">Nothing posted yet. Publish your first role on the left.</p>}
          {jobs.map((j) => (
            <div key={j._id} className="row between">
              <span>{j.title}</span>
              <span className="row"><button className="ghost" onClick={() => view(j._id)}>Applicants</button><button className="link" onClick={() => remove(j._id)}>Delete</button></span>
            </div>
          ))}
        </div>
        {open && (
          <div className="panel">
            <h2>Applicants</h2>
            {!apps.length && <p className="muted">No applications yet.</p>}
            {apps.map((a) => (
              <div key={a._id} className="applicant">
                <strong>{a.applicant.name}</strong> <span className="muted">{a.applicant.email}</span>
                <p className="pre small">{a.coverLetter || 'No cover letter.'}</p>
                <div className="row">
                  <span>Status: <strong>{a.status}</strong></span>
                  {['shortlisted', 'rejected', 'hired'].map((s) => <button key={s} className="ghost" onClick={() => status(a._id, s)}>{s}</button>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
