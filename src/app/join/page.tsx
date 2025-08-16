'use client'

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { checkUserId_client, joinUser_client } from '@/services/apiService';

const factories = [
    { name: '화성', code: 2 },
    { name: '인천', code: 1 },
    { name: '구미', code: 4 },
    { name: '양산', code: 3 },
];

type FormValues = {
    userId: string;
    userName: string;
    password: string;
    passwordConfirm: string;
    email: string;
    phone: string;
    locationId: number;
}

const JoinSuccess = ({ onGoToLogin }: { onGoToLogin: () => void }) => (
    <div className="relative w-3/4 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
        <img
            src="/images/dashboard.png"
            alt="대시보드 배경"
            className="w-full h-full object-cover filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-5xl font-extrabold font-noto-500 text-white mb-4 leading-tight text-center drop-shadow-lg">
                회원가입을 환영합니다!
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto font-noto-400 text-center drop-shadow-md">
                가입 신청이 정상적으로 접수되었습니다.<br />
                관리자 승인 후 서비스 이용이 가능합니다.
            </p>
            <button
                type="button"
                onClick={onGoToLogin}
                className="px-10 py-4 text-xl font-noto-400 cursor-pointer text-white bg-[rgba(111,131,175)] rounded-lg hover:bg-[rgba(101,121,165)] transition-all duration-300 transform hover:scale-105"
            >
                로그인 페이지로 이동
            </button>
        </div>
    </div>
);


export default function JoinPage() {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors }, watch, control, setValue } = useForm<FormValues>({
        mode: 'onChange',
        defaultValues: {
            userId: '',
            userName: '',
            password: '',
            passwordConfirm: '',
            email: '',
            phone: '',
            locationId: 0,
        }
    });

    const password = watch('password');
    const phoneValue = watch('phone');

    useEffect(() => {
        if (phoneValue) {
            const digitsOnly = phoneValue.replace(/[^\d]/g, '').substring(0, 11);
            let formatted = digitsOnly;
            if (digitsOnly.length > 3 && digitsOnly.length <= 7) {
                formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
            } else if (digitsOnly.length > 7) {
                formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
            }
            setValue('phone', formatted, { shouldValidate: true });
        }
    }, [phoneValue, setValue]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setIsSubmitting(true);
        try {
            const { passwordConfirm, ...submissionData } = data;
            await joinUser_client(submissionData);
            setIsSuccess(true);
        } catch (error) {
            console.error('회원가입 실패:', error);
            const errorMessage = axios.isAxiosError(error) && error.response
                ? (error.response.data as any)?.message || '서버 오류'
                : '예상치 못한 오류가 발생했습니다.';
            alert(`회원가입 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoToLogin = () => {
        router.push('/login');
    };

    return (
        <main className="flex items-center justify-center h-full w-full bg-[rgba(40,40,40)] text-white p-4">
            {isSuccess ? (
                <JoinSuccess onGoToLogin={handleGoToLogin} />
            ) : (
                <div className="w-full max-w-3xl">
                    <div className="text-center mb-8 font-noto-400">
                        <h1 className="text-4xl font-noto-500 mb-2">회원가입</h1>
                        <p className="text-[#E0E0E0] text-xl">FLOW LOGIC과 함께 여정을 시작하세요!</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 font-noto-400">
                            <div>
                                <label htmlFor="userId" className="text-xl text-gray-300">아이디</label>
                                <input id="userId" type="text" {...register('userId', { required: '아이디를 입력해주세요.', minLength: { value: 4, message: '4자 이상 입력해주세요.' }, validate: { isIdAvailable: async (value) => { if (value.length < 4) return true; try { const result = await checkUserId_client(value); return result === true ? '이미 사용 중인 아이디입니다.' : true; } catch (error) { return '아이디 중복 확인 중 오류가 발생했습니다.'; } } } })} className="w-full mt-2 px-4 py-6 bg-[rgba(30,30,30)] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200 text-xl" />
                                {errors.userId && <p className="text-sm text-red-400 mt-1">{errors.userId.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="userName" className="text-xl text-gray-300">이름</label>
                                <input id="userName" type="text" {...register('userName', { required: '이름을 입력해주세요.' })} className="w-full mt-2 px-4 py-6 bg-[rgba(30,30,30)] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200 text-xl" />
                                {errors.userName && <p className="text-sm text-red-400 mt-1">{errors.userName.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="password" className="text-xl text-gray-300">비밀번호</label>
                                <input id="password" type="password" {...register('password', { required: '비밀번호를 입력해주세요.', minLength: { value: 8, message: '8자 이상 입력해주세요.' } })} className="w-full mt-2 px-4 py-6 bg-[rgba(30,30,30)] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200 text-xl" />
                                {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="passwordConfirm" className="text-xl text-gray-300">비밀번호 확인</label>
                                <input id="passwordConfirm" type="password" {...register('passwordConfirm', { required: '비밀번호를 다시 입력해주세요.', validate: value => value === password || '비밀번호가 일치하지 않습니다.' })} className="w-full mt-2 px-4 py-6 bg-[rgba(30,30,30)] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200 text-xl" />
                                {errors.passwordConfirm && <p className="text-sm text-red-400 mt-1">{errors.passwordConfirm.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="text-xl text-gray-300">이메일</label>
                                <input id="email" type="email" {...register('email', { required: '이메일을 입력해주세요.', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: '유효한 이메일 주소를 입력해주세요.' } })} className="w-full mt-2 px-4 py-6 bg-[rgba(30,30,30)] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200 text-xl" />
                                {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="text-xl text-gray-300">휴대전화</label>
                                <input id="phone" type="tel" {...register('phone', { required: '휴대전화 번호를 입력해주세요.', pattern: { value: /^\d{3}-\d{3,4}-\d{4}$/, message: '올바른 휴대전화 번호 형식이 아닙니다.' } })} maxLength={13} className="w-full mt-2 px-4 py-6 bg-[rgba(30,30,30)] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] transition-shadow duration-200 text-xl" />
                                {errors.phone && <p className="text-sm text-red-400 mt-1">{errors.phone.message}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-gray-300 mb-2 text-xl">소속 공장</label>
                                <Controller
                                    name="locationId"
                                    control={control}
                                    rules={{ validate: (value) => value > 0 || "공장을 선택해주세요." }}
                                    render={({ field }) => (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {factories.map((factory) => (
                                                <button key={factory.code} type="button" onClick={() => field.onChange(factory.code)} className={`px-4 py-6 cursor-pointer border rounded-lg text-center text-xl transition-all duration-200 ${field.value === factory.code ? 'bg-[rgba(111,131,175)] text-white border-[rgba(111,131,175)] ring-2 ring-blue-300' : 'bg-[rgba(30,30,30))] text-gray-300 border-gray-600 hover:bg-[rgba(40,40,40)]'}`}>
                                                    {factory.name}
                                                </button>))}
                                        </div>)}
                                />
                                {errors.locationId && <p className="text-sm text-red-400 mt-2">{errors.locationId.message}</p>}
                            </div>
                        </div>

                        <div className="mt-8">
                            <button type="submit" className="w-full px-4 py-6 text-xl font-noto-400 text-white cursor-pointer bg-[rgba(111,131,175)] rounded-lg hover:bg-[rgba(101,121,165)] disabled:bg-gray-500 transition-colors duration-200" disabled={isSubmitting}>
                                {isSubmitting ? '가입 처리 중...' : '가입 신청'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    )
}