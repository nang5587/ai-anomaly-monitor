'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  sidebarWidth?: number;
}

export default function Header({ sidebarWidth = 0 }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  console.log(user, "나현아...")

  return (
    <header
      className="bg-white px-6 py-3 shadow-sm flex items-center justify-between"
      style={{ width: `calc(100vw - ${sidebarWidth}px)` }}
    >
      <h1 className="text-xl font-semibold text-gray-800">2D 바코드 진단 웹</h1>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              안녕하세요, <strong>{user.role}</strong> 님
            </span>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/login')} className="text-gray-600 hover:text-gray-800 transition-colors">
              로그인
            </button>
            <button onClick={() => router.push('/register')} className="text-gray-600 hover:text-gray-800 transition-colors">
              회원가입
            </button>
          </>
        )}
      </div>
    </header>
  );
}
