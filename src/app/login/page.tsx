'use client';
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginAction } from './actions';


import { FcGoogle } from 'react-icons/fc';
import jwtDecode from 'jwt-decode';
interface DecodedToken {
  role: string;
}
function getRedirectUrl(role: string) {
  switch (role) {
    case "ADMIN": return "/supervisor";
    case "MANAGER": return "/admin";
    default: return "/";
  }
}
const initialState: { message: string; success: boolean; token?: string; rememberMe?: boolean; } = {
  message: '',
  success: false,
  token: undefined,
  rememberMe: false,
};

function LoginButton() {
  // 3. useFormStatus 훅으로 폼의 제출 상태(pending)를 가져옴
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-md text-sm disabled:bg-indigo-300"
      disabled={pending} // 4. 로딩 중일 때 버튼 비활성화
    >
      {pending ? '로그인 중...' : '로그인'}
    </button>
  );
}

// ✅ default export 되는 로그인 컴포넌트
export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // 1. 로그인에 성공했고, state에 토큰이 포함되어 있다면
    if (state.success && state.token && typeof state.rememberMe === 'boolean') {
      login(state.token, state.rememberMe);

      try {
        const decoded: DecodedToken = jwtDecode(state.token);
        const redirectUrl = getRedirectUrl(decoded.role);
        router.push(redirectUrl);
      } catch (error) {
        console.error("토큰 디코딩 실패:", error);
        // 디코딩 실패 시 기본 페이지로 이동
        router.push('/');
      }
    }
  }, [state.success, state.token, state.rememberMe, router, login]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <img
        src="/images/bgTruck.png"
        alt="물류 배경"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-80 z-0"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-0" />

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="w-full max-w-xl p-8 bg-white bg-opacity-90 rounded-xl shadow-lg space-y-6">
          <div className="flex justify-center">
            <div className="bg-indigo-500 rounded-full p-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18m-6 6 6-6-6-6" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-center text-gray-800">Log in</h2>

          {/* <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 border rounded-md py-2 text-sm hover:bg-gray-100 bg-white">
              <FcGoogle className="w-5 h-5" />
              Google
            </button>
          </div>

          <div className="flex items-center justify-between">
            <hr className="w-full border-gray-300" />
            <span className="px-2 text-gray-400 text-sm">Or</span>
            <hr className="w-full border-gray-300" />
          </div> */}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">아이디</label>
              <input
                type="text"
                name="userId"
                placeholder="아이디 입력"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">비밀번호</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                required
              // autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="form-checkbox"
                />
                로그인 상태 유지
              </label>
            </div>

            <LoginButton />

            {/* 10. 서버로부터 받은 에러 메시지 표시 */}
            {!state.success && state.message && (
              <p className="text-sm text-red-500 text-center">{state.message}</p>
            )}
          </form>

          <p className="text-sm text-center text-gray-700">
            계정이 없으신가요?{' '}
            <a href="/join" className="text-indigo-600 hover:underline">회원가입</a>
          </p>
        </div>
      </div>
    </div>
  );
}
