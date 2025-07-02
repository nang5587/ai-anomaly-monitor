'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut , UserPlus } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header
      className="fixed top-0 left-0 right-0 w-full bg-black px-12 py-3 shadow-sm flex items-center justify-between z-50 h-20"
    >
      <h1 className="text-3xl text-white font-reem-kufi">FLOW LOGIC</h1>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-white">
              안녕하세요, <strong>{user.role}</strong> 님
            </span>
            <button
              onClick={logout}
              className="text-white hover:text-[rgba(111,131,175,1)] transition-colors"
            >
              {/* 로그아웃 */}
              <LogOut className="w-6 h-6" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/login')} className="text-white p-3">
              {/* 로그인 */}
              <LogIn className="w-6 h-6" />
            </button>
            <button onClick={() => router.push('/register')} className="text-white p-3">
              {/* 회원가입 */}
              <UserPlus className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
