'use client';
import jwtDecode from 'jwt-decode';

interface JwtPayload {
  userName: string;
  role: string;
  factoryCode?: number;
}
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { userName: string; role: string; factoryCode?: number; } | null;
  login: (token: string, rememberMe: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ userName: string; role: string; factoryCode?: number; } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const localToken = localStorage.getItem('token');
    const sessionToken = sessionStorage.getItem('token');

    const storage = localToken ? localStorage : (sessionToken ? sessionStorage : null);

    if (storage) {
      const token = storage.getItem('token');
      const userName = storage.getItem('userName');
      const role = storage.getItem('role');
      const factoryCodeString = storage.getItem('factoryCode'); // ⭐storage는 항상 string 또는 null 반환

      if (token && userName && role) {
        const restoredUser = {
          userName,
          role,
          // 숫자로 변환해야 함
          ...(factoryCodeString && { factoryCode: Number(factoryCodeString) }),
        };
        setUser(restoredUser);
      } else {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
      }
    }
  }, []);

  const login = (token: string, rememberMe: boolean) => {
    const { userName, role, factoryCode } = jwtDecode<JwtPayload>(token);
    console.log("Decoded User Info:", { userName, role, factoryCode });

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('userName', userName);
    storage.setItem('role', role);

    if (typeof factoryCode === 'number') {
      storage.setItem('factoryCode', factoryCode.toString());
    } else {
      storage.removeItem('factoryCode');
    }

    const newUser = {
      userName,
      role,
      ...(typeof factoryCode === 'number' && { factoryCode }),
    };
    setUser(newUser);
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
