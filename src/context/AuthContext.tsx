'use client';
import jwtDecode from 'jwt-decode';

interface JwtPayload {
  userName: string;
  role: string;
}
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { userName: string; role: string } | null;
  login: (token: string, rememberMe: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ userName: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');

  const storage = localToken ? localStorage : (sessionToken ? sessionStorage : null);

  if (storage) {
    const token = storage.getItem('token');
    const userName = storage.getItem('userName');
    const role = storage.getItem('role');

    if (token && userName && role) {
      setUser({ userName, role });
    } else {
      // 로그인 정보 누락 시 정리
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
    }
  }
}, []);

  const login = (token: string, rememberMe: boolean) => {
  const { userName, role } = jwtDecode<JwtPayload>(token);
  console.log(role, "🔴")

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('userName', userName);
  storage.setItem('role', role);

  setUser({ userName, role });
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
