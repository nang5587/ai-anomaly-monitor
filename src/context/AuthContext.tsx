// src/context/AuthContext.tsx
'use client';
import jwtDecode from 'jwt-decode';

interface JwtPayload {
  username: string;
  role: string;
}
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { username: string; role: string } | null;
  login: (token: string, rememberMe: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');

  const storage = localToken ? localStorage : (sessionToken ? sessionStorage : null);

  if (storage) {
    const token = storage.getItem('token');
    const username = storage.getItem('username');
    const role = storage.getItem('role');

    if (token && username && role) {
      setUser({ username, role });
    } else {
      // 로그인 정보 누락 시 정리
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
    }
  }
}, []);

  const login = (token: string, rememberMe: boolean) => {
  const { username, role } = jwtDecode<JwtPayload>(token);

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('username', username);
  storage.setItem('role', role);

  setUser({ username, role });
};

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
