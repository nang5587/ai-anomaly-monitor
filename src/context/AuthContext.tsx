'use client';
import jwtDecode from 'jwt-decode';

interface JwtPayload {
  userId: string;
  role: string;
  location_id?: number;
}

export interface User {
  userId: string; // 로그인 ID
  role: string;
  locationId?: number;

  // 선택적
  userName?: string;
  email?: string;
}

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { userId: string; role: string; locationId?: number; } | null;
  login: (token: string, rememberMe: boolean) => void;
  logout: () => void;
  updateUserContext: (updatedInfo: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ userId: string; role: string; locationId?: number; } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 세션 또는 로컬 스토리지 중 토큰이 있는 곳을 찾음
    const storage = localStorage.getItem('accessToken') ? localStorage : (sessionStorage.getItem('accessToken') ? sessionStorage : null);

    if (storage) {
      const token = storage.getItem('accessToken');
      if (token) {
        try {
          // 토큰을 디코딩하여 필수 정보를 얻음
          const { userId, role, location_id } = jwtDecode<JwtPayload>(token);
          const locationId = location_id;
          // ✨ 토큰 외에 저장해 둔 추가 정보(userName, email)도 함께 읽어옴
          const userName = storage.getItem('userName') || undefined;
          const email = storage.getItem('email') || undefined;

          // 복원된 사용자 객체 생성
          const restoredUser: User = { userId, role, locationId, userName, email };
          setUser(restoredUser);
        } catch (error) {
          // 유효하지 않은 토큰일 경우, 모든 정보를 지움
          console.error("Invalid token found in storage.", error);
          logout();
        }
      }
    }
  }, []);

  const login = useCallback((token: string, rememberMe: boolean) => {
    const { userId, role, location_id } = jwtDecode<JwtPayload>(token);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', token);
    const locationId = location_id;
    const newUser: User = { userId, role, locationId };
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    router.push('/login');
  }, [router]);

  // 회원정보 변경 적용
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
    <AuthContext.Provider value={{ user, login, logout, updateUserContext }}>
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
