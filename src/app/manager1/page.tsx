'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function manager1Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return; // 아직 로딩 중일 수 있음

    if (user.role !== 'user1'){
      alert('접근 권한이 없습니다.');
      router.push('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'user1') {
    return null; // 권한 없거나 초기 로딩 중이면 아무것도 안 보이게
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">매니저1 관리자 대시보드</h2>
      <p className="text-gray-700">안녕하세요, <strong>{user.role}</strong> 님!</p>
      <div className="p-6 mt-6 bg-white rounded-lg shadow">
        <main className="flex-1 p-6 overflow-auto bg-gray-100">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">대시보드</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="mb-2 text-lg font-semibold">오늘 처리된 작업</h3>
              <p className="text-3xl font-bold text-gray-600">124건</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="mb-2 text-lg font-semibold">불량률</h3>
              <p className="text-3xl font-bold text-gray-600">2.4%</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="mb-2 text-lg font-semibold">알림</h3>
              <p className="text-3xl font-bold text-gray-600">3건</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
