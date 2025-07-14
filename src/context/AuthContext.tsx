'use client';
import jwtDecode from 'jwt-decode';

interface JwtPayload {
  userName: string;
  role: string;
  factoryCode?: number;
}

export interface User {
  userName: string; // 로그인 ID
  role: string;
  factoryCode?: number;

  // 선택적
  realName?: string;
  email?: string;
}

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { userName: string; role: string; factoryCode?: number; } | null;
  login: (token: string, rememberMe: boolean) => void;
  logout: () => void;
  updateUserContext: (updatedInfo: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ userName: string; role: string; factoryCode?: number; } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 세션 또는 로컬 스토리지 중 토큰이 있는 곳을 찾음
    const storage = localStorage.getItem('accessToken') ? localStorage : (sessionStorage.getItem('accessToken') ? sessionStorage : null);

    if (storage) {
      const token = storage.getItem('accessToken');
      if (token) {
        try {
          // 토큰을 디코딩하여 필수 정보를 얻음
          const { userName, role, factoryCode } = jwtDecode<JwtPayload>(token);

          // ✨ 토큰 외에 저장해 둔 추가 정보(realName, email)도 함께 읽어옴
          const realName = storage.getItem('realName') || undefined;
          const email = storage.getItem('email') || undefined;

          // 복원된 사용자 객체 생성
          const restoredUser: User = { userName, role, factoryCode, realName, email };
          setUser(restoredUser);
        } catch (error) {
          // 유효하지 않은 토큰일 경우, 모든 정보를 지움
          console.error("Invalid token found in storage.", error);
          logout();
        }
      }
    }
  }, []);

  const login = (token: string, rememberMe: boolean) => {
    const { userName, role, factoryCode } = jwtDecode<JwtPayload>(token);

    // 토큰과 필수 정보를 스토리지에 저장
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', token);

    const newUser: User = { userName, role, factoryCode };
    setUser(newUser);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    router.push('/login');
  };

  // 회원정보 변경 적용
  const updateUserContext = (updatedInfo: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null; // 이전 사용자가 없으면 아무것도 안 함

      const newUser = { ...prevUser, ...updatedInfo };

      // 변경된 정보를 스토리지에도 반영하여 새로고침 시 유지되도록 함
      const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage;
      if (storage) {
        if (updatedInfo.realName) storage.setItem('realName', updatedInfo.realName);
        if (updatedInfo.email) storage.setItem('email', updatedInfo.email);
      }

      return newUser;
    });
  };

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
