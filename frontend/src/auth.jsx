import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);

  const finish = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); return user; };
  const login = async (body) => finish((await api.post('/auth/login', body)).data);
  const register = async (body) => finish((await api.post('/auth/register', body)).data);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  const saveProfile = async (body) => setUser((await api.put('/auth/profile', body)).data);

  return <Ctx.Provider value={{ user, ready, login, register, logout, saveProfile }}>{children}</Ctx.Provider>;
}
