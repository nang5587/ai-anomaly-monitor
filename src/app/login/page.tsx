'use client';
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginAction } from './actions';
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
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="w-full bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] text-white font-noto-400 py-6 rounded-lg text-xl transition-colors duration-200 disabled:bg-[rgba(121,141,185)] cursor-pointer"
      disabled={pending}
    >
      {pending ? '로그인 중...' : '로그인'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (state.success && state.token && typeof state.rememberMe === 'boolean') {
      login(state.token, state.rememberMe);

      try {
        const decoded: DecodedToken = jwtDecode(state.token);
        const redirectUrl = getRedirectUrl(decoded.role);
        router.push(redirectUrl);
      } catch (error) {
        console.error("토큰 디코딩 실패:", error);
        router.push('/');
      }
    }
  }, [state.success, state.token, state.rememberMe, router, login]);

  return (
    <div className="min-h-screen bg-[rgba(40,40,40)] text-white flex items-center justify-center p-4">
      <div className="w-full flex overflow-hidden">

        <div className="w-full flex justify-center items-center p-8 md:p-12">
          <div className='w-3/4'>
            <h1 className="text-5xl font-noto-500 font-black mb-4 leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
              복잡한 물류 분석,<br />
              이제는 간편하게.
            </h1>
            <p className="font-noto-400 text-[#E0E0E0] text-xl drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
              CSV 파일 업로드만으로 AI 이상 탐지부터 시각화, 보고서 작성까지.<br />
              당신의 가장 강력한 물류 분석가가 지금 대기중입니다.
            </p>
          </div>
        </div>
        <div className="w-full flex justify-center p-8 md:p-12">
          <div className='w-3/4'>
            <form action={formAction} className="space-y-6">
              <div>
                <label className="text-xl font-noto-400 text-gray-400">아이디</label>
                <input
                  type="text"
                  name="userId"
                  placeholder="아이디를 입력하세요"
                  className="w-full mt-2 px-4 py-6 border border-gray-600 rounded-lg font-noto-400 text-xl bg-[rgba(30,30,30)] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200"
                  required
                />
              </div>
              <div>
                <label className="text-xl font-noto-400 text-gray-400">비밀번호</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full mt-2 px-4 py-6 border border-gray-600 rounded-lg font-noto-400 text-xl bg-[rgba(30,30,30)] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xl">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 font-noto-400 text-[rgba(111,131,175)] focus:ring-[rgba(111,131,175)] rounded"
                  />
                  로그인 상태 유지
                </label>
              </div>

              <LoginButton />

              {state.message && (
                <p className={`text-xl text-center ${state.success ? 'text-green-400' : 'text-red-400'}`}>
                  {state.message}
                </p>
              )}
            </form>

            <p className="font-noto-400 text-xl text-center text-gray-500 mt-8">
              계정이 없으신가요?{' '}
              <a href="/join" className="font-noto-400 text-[rgba(111,131,175)] hover:underline">회원가입</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}