'use client';
import jwtDecode from 'jwt-decode';
import { getMyProfile } from '@/api/userApi';

interface JwtPayload {
  userId: string;
  role: string;
  location_id?: number;
}

export interface User {
  userId: string;
  role: string;
  locationId?: number;
  userName?: string;
  email?: string;
}

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, rememberMe: boolean) => void;
  logout: () => void;
  updateUserContext: (updatedInfo: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  const logout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    router.push('/login');
  }, [router]);
  
  const login = useCallback(async (token: string, rememberMe: boolean) => {
    try {
      setIsLoading(true);
      const { userId, role, location_id } = jwtDecode<JwtPayload>(token);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('accessToken', token);

      const profile = await getMyProfile(); 

      const newUser: User = {
        userId,
        role,
        locationId: location_id,
        userName: profile.userName, 
        email: profile.email,       
      };

      if (profile.userName) storage.setItem('userName', profile.userName);
      if (profile.email) storage.setItem('email', profile.email);

      setUser(newUser);
    } catch (error) {
      console.error("Login process failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);


  useEffect(() => {
    const storage = localStorage.getItem('accessToken') ? localStorage : (sessionStorage.getItem('accessToken') ? sessionStorage : null);

    if (storage) {
      const token = storage.getItem('accessToken');
      if (token) {
        try {
          const { userId, role, location_id } = jwtDecode<JwtPayload>(token);
          const locationId = location_id;
          const userName = storage.getItem('userName') || undefined;
          const email = storage.getItem('email') || undefined;
          const restoredUser: User = { userId, role, locationId, userName, email };
          setUser(restoredUser);
        } catch (error) {
          console.error("Invalid token found in storage.", error);
          logout();
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const updateUserContext = useCallback((updatedInfo: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedInfo };
      const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage;
      if (storage) {
        if (updatedInfo.userName) storage.setItem('userName', updatedInfo.userName);
        if (updatedInfo.email) storage.setItem('email', updatedInfo.email);
      }
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserContext }}>
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
