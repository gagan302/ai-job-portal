import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import { Login, Register } from './pages/AuthPages';
import SeekerHub from './pages/SeekerHub';
import RecruiterHub from './pages/RecruiterHub';

function Guard({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="muted pad">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">Hirewise</Link>
        <nav>
          <NavLink to="/">Jobs</NavLink>
          {user?.role === 'seeker' && <NavLink to="/me">My workspace</NavLink>}
          {user?.role === 'recruiter' && <NavLink to="/recruiter">Hiring</NavLink>}
          {user ? <button className="link" onClick={logout}>Sign out</button> : (<><NavLink to="/login">Sign in</NavLink><NavLink to="/register" className="cta">Create account</NavLink></>)}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/me" element={<Guard role="seeker"><SeekerHub /></Guard>} />
          <Route path="/recruiter" element={<Guard role="recruiter"><RecruiterHub /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
