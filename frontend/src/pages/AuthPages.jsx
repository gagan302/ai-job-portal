import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMsg } from '../api';

function Form({ mode }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'seeker', company: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const u = mode === 'login' ? await login(f) : await register(f);
      nav(u.role === 'recruiter' ? '/recruiter' : '/me');
    } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
      {mode === 'register' && (<>
        <label>Full name<input value={f.name} onChange={set('name')} required /></label>
        <label>I am a
          <select value={f.role} onChange={set('role')}>
            <option value="seeker">Job seeker</option><option value="recruiter">Recruiter</option>
          </select>
        </label>
        {f.role === 'recruiter' && <label>Company<input value={f.company} onChange={set('company')} required /></label>}
      </>)}
      <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
      <label>Password<input type="password" minLength={6} value={f.password} onChange={set('password')} required /></label>
      {err && <p className="error">{err}</p>}
      <button className="primary">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <p className="muted">{mode === 'login' ? <>New here? <Link to="/register">Create an account</Link></> : <>Already registered? <Link to="/login">Sign in</Link></>}</p>
    </form>
  );
}
export const Login = () => <Form mode="login" />;
export const Register = () => <Form mode="register" />;
