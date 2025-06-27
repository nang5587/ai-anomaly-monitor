'use client'

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import axios from 'axios'; // isAxiosError 타입을 위해 유지
import apiClient from '@/api/apiClient';
import { useRouter } from 'next/navigation';

const factories = [
    { name: '화성', code: 128324 },
    { name: '인천', code: 584374 },
    { name: '구미', code: 238435 },
    { name: '양산', code: 594234 },
];

// 폼 입력값
type FormValues = {
    userId: string;
    userName: string;
    password: string;
    passwordConfirm: string;
    email: string;
    phone: string;
    factoryCode: number;
}

// 부모로 받을 step, setStep
interface LeftFormAreaProps {
    step: number;
    setStep: React.Dispatch<React.SetStateAction<number>>;
}

export default function LeftFormArea({ step, setStep }: LeftFormAreaProps) {
    const { register, handleSubmit, formState: { errors }, watch, trigger, control, resetField, setValue } = useForm<FormValues>({
        // ⭐ onChange : 입력값 바뀔 때마다 유효성 검사함
        mode: 'onChange', defaultValues: {
            userId: '',
            userName: '',
            password: '',
            passwordConfirm: '',
            email: '',
            phone: '',
            factoryCode: 0,
        }
    });

    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);

    //⭐감시하겠다는 뜻
    const password = watch('password');
    const factoryCodeValue = watch('factoryCode');
    const phoneValue = watch('phone');

    // 전화번호 자동 하이픈
    useEffect(() => {
        if (phoneValue) {
            // 숫자만 남기고, 11자리를 넘지 않도록 자릅니다.
            const digitsOnly = phoneValue.replace(/[^\d]/g, '').substring(0, 11);

            // 하이픈을 추가합니다.
            let formatted = digitsOnly;
            if (digitsOnly.length > 3 && digitsOnly.length <= 7) {
                formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
            } else if (digitsOnly.length > 7) {
                formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
            }

            // 포맷팅된 값으로 필드 값을 업데이트합니다.
            // 마지막 인자는 shouldValidate: false로 설정하여 무한 루프를 방지할 수 있습니다.
            setValue('phone', formatted, { shouldValidate: true });
        }
    }, [phoneValue, setValue]);

    const handleNextToStep2 = async () => {
        const isStep1Valid = await trigger(['userId', 'userName', 'password', 'passwordConfirm']);
        if (isStep1Valid) {
            setStep(2);
        }
    };

    const handleNextToStep3 = async () => {
        const isStep2Valid = await trigger(['email', 'phone']);
        if (isStep2Valid) {
            setStep(3);
        }
    };

    const handlePreviousStep = () => {
        if (step === 3) {
            resetField('factoryCode');
        }
        setStep(prevStep => prevStep - 1);
    };

    // 실제 백이랑 연결
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setIsSubmitting(true);
        try {
            const { ...submissionData } = data;

            await apiClient.post('/public/join', submissionData);
            setStep(4);
        } catch (error) {
            console.error('회원가입 실패:', error);
            if (axios.isAxiosError(error) && error.response) {
                alert(`회원가입 중 오류가 발생했습니다: ${error.response.data.message || '서버 오류'}`);
            } else {
                alert('회원가입 중 예상치 못한 오류가 발생했습니다.');
            }
        } finally {
            setIsSubmitting(false); // 로딩 상태 종료
        }
    };

    const handleGoToLogin = () => {
        router.push('/login');
    };

    // 엔터 키가 눌렸을 때만 로직 실행
    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter') {
            // ⭐기본 폼 제출(submit) 동작을 막아서, 각 단계에 맞는 유효성 검사만 실행되도록 함
            e.preventDefault();

            if (step === 1) {
                handleNextToStep2();
            } else if (step === 2) {
                handleNextToStep3();
            } else if (step === 3) {
                // 3단계에서는 사용자가 '회원가입 완료' 버튼을 직접 누르므로,
                // 이 버튼이 활성화되었을 때만 수동으로 submit을 트리거함.
                if (factoryCodeValue) {
                    handleSubmit(onSubmit)();
                }
            }
        }
    };

    return (
        <div className="w-full max-w-md px-8 space-y-4">
            <div className="text-center">
                <p className="text-gray-500">"회사이름"과 함께 여정을 시작하세요!</p>
            </div>

            <div className="h-[470px] overflow-hidden">
                <form
                    className="transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateY(-${(step - 1) * 470}px)` }}
                    onSubmit={handleSubmit(onSubmit)}
                    onKeyDown={handleKeyDown}
                    noValidate
                >
                    {/* ----- 1단계 폼 ----- */}
                    <div className="h-[470px] flex flex-col">
                        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
                            <div>
                                <label htmlFor="userId">아이디</label>
                                <input
                                    id="userId"
                                    type="text"
                                    {...register('userId', {
                                        required: '아이디를 입력해주세요.',
                                        minLength: { value: 4, message: '4자 이상 입력해주세요.' },
                                        validate: {
                                            isIdAvailable: async (value) => {
                                                if (value.length < 4) return true; // 최소 길이를 만족할 때만 검사
                                                try {
                                                    // apiClient로 아이디 중복 확인 요청
                                                    const response = await apiClient.post('/public/join/idsearch', { userId: value });
                                                    return response.data === true ? '이미 사용 중인 아이디입니다.' : true;
                                                } catch (error) {
                                                    console.error("ID Check API Error:", error);
                                                    return '아이디 중복 확인 중 오류가 발생했습니다.';
                                                }
                                            }
                                        }
                                    })}
                                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                                />
                                {errors.userId && <p className="text-sm text-blue-600 mt-1">{errors.userId.message}</p>}
                            </div>
                            <div><label htmlFor="userName">이름</label><input id="userName" type="text" {...register('userName', { required: '이름을 입력해주세요.' })} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />{errors.userName && <p className="text-sm text-blue-600 mt-1">{errors.userName.message}</p>}</div>
                            <div><label htmlFor="password">비밀번호</label><input id="password" type="password" {...register('password', { required: '비밀번호를 입력해주세요.', minLength: { value: 8, message: '8자 이상 입력해주세요.' } })} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />{errors.password && <p className="text-sm text-blue-600 mt-1">{errors.password.message}</p>}</div>
                            <div><label htmlFor="passwordConfirm">비밀번호 확인</label><input id="passwordConfirm" type="password" {...register('passwordConfirm', { required: '비밀번호를 다시 입력해주세요.', validate: value => value === password || '비밀번호가 일치하지 않습니다.' })} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />{errors.passwordConfirm && <p className="text-sm text-blue-600 mt-1">{errors.passwordConfirm.message}</p>}</div>
                        </div>
                        <div className="py-4 px-2">
                            <button type="button" onClick={handleNextToStep2} className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">다음</button>
                        </div>
                    </div>

                    {/* ----- 2단계 폼 ----- */}
                    <div className="h-[470px] flex flex-col">
                        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
                            <div><label htmlFor="email">이메일</label><input id="email" type="email" {...register('email', { required: '이메일을 입력해주세요.', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: '유효한 이메일 주소를 입력해주세요.' } })} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />{errors.email && <p className="text-sm text-blue-600 mt-1">{errors.email.message}</p>}</div>
                            <div><label htmlFor="phone">휴대전화</label><input id="phone" type="tel" {...register('phone', {
                                required: '휴대전화 번호를 입력해주세요.', pattern: {
                                    value: /^\d{3}-\d{3,4}-\d{4}$/,
                                    message: '올바른 휴대전화 번호 형식이 아닙니다.',
                                },
                            })}
                                maxLength={13} // '010-1234-5678'은 13자리
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            />
                                {errors.phone && <p className="text-sm text-blue-600 mt-1">{errors.phone.message}</p>}</div>
                        </div>
                        <div className="flex items-center gap-4 py-4 px-2">
                            <button type="button" onClick={handlePreviousStep} className="w-1/3 px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                                이전
                            </button>
                            <button type="button" onClick={handleNextToStep3} className="w-2/3 px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                다음
                            </button>
                        </div>
                    </div>

                    {/* ----- 3단계 폼 ----- */}
                    <div className="h-[470px] flex flex-col">
                        <div className="flex-1 overflow-y-auto py-4 px-2">
                            <label className="block text-xl font-semibold text-center mb-6">소속 공장을 선택하세요</label>
                            <Controller
                                name="factoryCode"
                                control={control}
                                rules={{ validate: (value) => value > 0 || "공장을 선택해주세요." }}
                                render={({ field }) => (
                                    <div className="grid grid-cols-2 gap-4">
                                        {factories.map((factory) => (
                                            <button key={factory.code} type="button" onClick={() => { const newValue = field.value === factory.code ? 0 : factory.code; field.onChange(newValue); }} className={`p-4 border rounded-lg text-center font-semibold transition-all duration-200 ${field.value === factory.code ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                                {factory.name}
                                            </button>))}
                                    </div>)}
                            />
                            {errors.factoryCode && <p className="text-sm text-blue-600 mt-2 text-center">
                                {errors.factoryCode.message}
                            </p>}
                        </div>
                        <div className="flex items-center gap-4 py-4 px-2">
                            <button type="button" onClick={handlePreviousStep} className="w-1/3 px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                                이전
                            </button>
                            <button type="submit" className="w-2/3 px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={!factoryCodeValue}>
                                회원가입 완료
                            </button>
                        </div>
                    </div>

                    <div className="h-[470px] flex flex-col items-center justify-between text-center px-4">
                        <div className='flex flex-col justify-center items-center pt-10'>
                            <svg className="w-20 h-20 text-green-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>

                            <h2 className="text-3xl font-bold text-gray-800 mb-2">회원가입 완료!</h2>
                            <p className="text-gray-600 mb-8 pt-5">환영합니다!<br />가입 신청이 정상적으로 접수되었습니다.</p>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoToLogin}
                            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            메인페이지로 이동
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}