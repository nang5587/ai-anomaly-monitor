'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return; // 아직 로딩 중일 수 있음

    if (user.role !== 'ADMIN'){
      alert('접근 권한이 없습니다.');
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return null; // 권한 없거나 초기 로딩 중이면 아무것도 안 보이게
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">슈퍼바이저 관리자 대시보드</h2>
      <p className="text-gray-700">안녕하세요, <strong>{user.role}</strong> 님!</p>
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">대시보드</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">오늘 처리된 작업</h3>
              <p className="text-gray-600 text-3xl font-bold">124건</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">불량률</h3>
              <p className="text-gray-600 text-3xl font-bold">2.4%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">알림</h3>
              <p className="text-gray-600 text-3xl font-bold">3건</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
