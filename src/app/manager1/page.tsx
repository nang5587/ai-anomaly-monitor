'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Manager1Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'manager1') {
      alert('접근 권한이 없습니다.');
      router.push('/login');
    }
  }, [user]);

  if (!user || user.role !== 'manager1') return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">1공장 관리자 대시보드</h1>
      <p>{user.role}님 환영합니다.</p>
    </div>
  );
}