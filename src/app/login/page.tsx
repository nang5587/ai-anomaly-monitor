'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import apiClient from '../../api/apiClient';
import jwtDecode from 'jwt-decode';

interface DecodedToken {
  role: string;
}

function getRedirectUrl(role: string) {
  switch (role) {
    case "supervisor": return "/supervisor";
    case "manager1": return "/manager1";
    case "manager2": return "/manager2";
    case "manager3": return "/manager3";
    default: return "/";
  }
}

// ✅ default export 되는 로그인 컴포넌트
export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ✅ apiClient(Axios)를 사용한 올바른 API 요청
      const response = await apiClient.post('/public/login', {
        // JavaScript 객체를 바로 전달하면 Axios가 JSON으로 변환해줍니다.
        userId,
        password
      });
      const authHeader = response.headers['authorization'] || response.headers['Authorization'];

      console.log('로그인 성공:', response.data);

      if (authHeader && authHeader.startsWith('Bearer ')) {
        // "Bearer " 접두사를 제거하고 실제 토큰 값만 추출합니다.
        const token = authHeader.split(' ')[1];
        console.log('로그인 성공! 헤더에서 토큰을 추출했습니다.');
        
        const decoded: DecodedToken = jwtDecode(token);
        const role = decoded.role;
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem('accessToken', token);
        storage.setItem('role', role);

        router.push(getRedirectUrl(role));
      } else {
        // 성공 응답(2xx)을 받았지만, 예상과 달리 헤더에 토큰이 없는 경우의 에러 처리
        throw new Error('로그인 응답이 올바르지 않습니다. (토큰 없음)');
      }

    } catch (err) {
      if (axios.isAxiosError(err)) {
        // 위에서 throw한 Error도 이쪽으로 올 수 있습니다.
        const errorMessage = err.response?.data?.message || err.message || '아이디 또는 비밀번호가 잘못되었습니다.';
        alert(errorMessage);
        console.error('로그인 API 에러:', err.response || err);
      } else {
        alert('로그인 중 알 수 없는 오류가 발생했습니다.');
        console.error('로그인 중 일반 에러:', err);
      }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <img
        src="/images/bgTruck.png"
        alt="물류 배경"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-80 z-0"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-0" />

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="w-full max-w-sm p-8 bg-white bg-opacity-90 rounded-xl shadow-lg space-y-6">
          <div className="flex justify-center">
            <div className="bg-indigo-500 rounded-full p-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18m-6 6 6-6-6-6" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-center text-gray-800">Log in</h2>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 border rounded-md py-2 text-sm hover:bg-gray-100 bg-white">
              <FcGoogle className="w-5 h-5" />
              Google
            </button>
          </div>

          <div className="flex items-center justify-between">
            <hr className="w-full border-gray-300" />
            <span className="px-2 text-gray-400 text-sm">Or</span>
            <hr className="w-full border-gray-300" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">아이디</label>
              <input
                type="text"
                placeholder="아이디 입력"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                로그인 상태 유지
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-md text-sm"
            >
              로그인
            </button>
          </form>

          <p className="text-sm text-center text-gray-700">
            계정이 없으신가요?{' '}
            <a href="#" className="text-indigo-600 hover:underline">회원가입</a>
          </p>
        </div>
      </div>
    </div>
  );
}
