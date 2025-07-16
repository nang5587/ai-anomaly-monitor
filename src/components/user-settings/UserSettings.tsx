'use client';

import { useState, useEffect, useMemo } from 'react';
// import { useAuth } from '@/context/AuthContext'; // 1. 실제 훅은 주석 처리
import { toast } from 'sonner';
import { KeyIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { getMyProfile, updateProfileInfo, changePassword } from '@/api/userApi';


// --- ✨ 더미 데이터 테스트를 위한 Mock API 함수들 (컴포넌트 내에 유지) ---

async function mockGetMyProfile(userId: string): Promise<{ userName: string; email: string; }> {
    console.log(`[MOCK] Fetching profile for ID: ${userId}`);
    // 실제 이름과 이메일을 반환하는 API 시뮬레이션
    return Promise.resolve({
        userName: '관리자_실제이름',
        email: 'admin_real@example.com',
    });
}

async function mockUpdateProfile(userId: string, data: { userName: string; email: string }) {
    console.log(`[MOCK] Updating profile for ID ${userId}:`, data);
    return new Promise(resolve => setTimeout(() => resolve({ success: true, updatedUser: data }), 500));
}

async function mockChangePassword(userId: string, data: { password: string, newPassword: string }) {
    console.log(`[MOCK] Changing password for ID ${userId}`);
    if (data.newPassword.length < 4) { // 더미용 간단한 규칙
        toast.error("새 비밀번호가 너무 짧습니다.");
        return Promise.resolve({ success: false });
    }
    if (data.password !== "password123") { // 테스트용 현재 비밀번호
        toast.error("현재 비밀번호가 올바르지 않습니다.");
        return Promise.resolve({ success: false });
    }
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
}

const factoryCodeNameMap: { [key: number]: string } = {
    1: '인천', 2: '화성', 3: '양산', 4: '구미',
};

export default function UserSettings() {
    // 2. AuthContext 대신 고정된 목업 user 객체를 사용합니다.
    const user = {
        userName: 'admin_id', // 로그인 ID
        role: 'ADMIN',       // 'ADMIN' 또는 'MANAGER'
        locationId: 0,      // MANAGER일 경우 1, 2, 3, 4 등으로 변경
    };
    
    // 3. updateUserContext는 없으므로 빈 함수로 정의하여 에러 방지
    const updateUserContext = (info: any) => {
        console.log('[MOCK] updateUserContext called with:', info);
    };

    const [formData, setFormData] = useState({ userName: '', email: '' });
    const [passwordData, setPasswordData] = useState({ password: '', newPassword: '', confirmPassword: '' });
    
    const [originalProfile, setOriginalProfile] = useState({ userName: '', email: '' });
    const [isProfileChanged, setIsProfileChanged] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 상세 프로필 정보를 가져오는 로직 (목업 API 사용)
    useEffect(() => {
        async function fetchProfile() {
            if (user) {
                setIsLoading(true);
                try {
                    const profileFromServer = await mockGetMyProfile(user.userName);
                    setFormData(profileFromServer);
                    setOriginalProfile(profileFromServer);
                } catch (error) {
                    toast.error("프로필 정보를 불러오는 데 실패했습니다.");
                } finally {
                    setIsLoading(false);
                }
            }
        }
        fetchProfile();
    }, []); // user가 바뀌면 다시 fetch (지금은 고정이라 한 번만 실행됨)

    // 변경사항 감지 로직
    useEffect(() => {
        const hasChanged = formData.userName !== originalProfile.userName || formData.email !== originalProfile.email;
        setIsProfileChanged(hasChanged);
    }, [formData, originalProfile]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // 프로필 저장 핸들러
    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isProfileChanged) return;

        toast.loading("프로필을 업데이트하는 중...");
        try {
            const result = await mockUpdateProfile(user.userName, { userName: formData.userName, email: formData.email });
            toast.success("프로필이 성공적으로 업데이트되었습니다.");
            setOriginalProfile(formData); // 원본 데이터를 새 데이터로 갱신
        } catch (error) {
            toast.error("프로필 업데이트에 실패했습니다.");
        }
    };
    
    // 비밀번호 변경 핸들러
    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("새 비밀번호가 일치하지 않습니다."); return;
        }

        toast.loading("비밀번호를 변경하는 중...");
        try {
            const result = await mockChangePassword(user.userName, {
                password: passwordData.password,
                newPassword: passwordData.newPassword,
            });
            if (result.success) {
                toast.success("비밀번호가 성공적으로 변경되었습니다.");
                setPasswordData({ password: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.log("Password change failed in mock");
        }
    };

    const factoryName = useMemo(() => {
        if (!user) return '';
        if (user.role === 'ADMIN') return '전체 관리';
        return user.locationId ? factoryCodeNameMap[user.locationId] || '미지정' : '소속 없음';
    }, [user]);

    if (isLoading) {
        return <div className="p-8 text-white">정보를 불러오는 중...</div>;
    }

    return (
        <div className="p-4 sm:p-8 text-white w-full flex justify-center gap-10">
            {/* 프로필 정보 수정 섹션 */}
            <div className="flex flex-col justify-between bg-[rgba(30,30,30)] p-6 rounded-2xl w-1/2">
                <div>
                    <div className="flex items-center gap-4 mb-6">
                        <UserCircleIcon className="w-8 h-8 text-[#E0E0E0]" />
                        <h2 className="text-xl font-noto-400">프로필</h2>
                    </div>
                    <form id="profileForm" onSubmit={handleProfileSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">아이디</label>
                            <input value={user.userName} readOnly className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">소속 공장</label>
                            <input value={factoryName} readOnly className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">이름</label>
                            <input name="userName" type="text" value={formData.userName} onChange={handleProfileChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">이메일</label>
                            <input name="email" type="email" value={formData.email} onChange={handleProfileChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                        </div>
                    </form>
                </div>
                <div className="pt-4 text-right">
                    <button form="profileForm" type="submit" disabled={!isProfileChanged} className="font-noto-500 px-4 py-2 rounded-md bg-[rgba(111,131,175)] hover:bg-[rgba(91,111,155)] disabled:bg-gray-600 disabled:cursor-not-allowed">
                        저장
                    </button>
                </div>
            </div>

            {/* 비밀번호 변경 섹션 */}
            <div className="bg-[rgba(30,30,30)] p-6 rounded-2xl w-1/2">
                <div className="flex items-center gap-4 mb-6">
                    <KeyIcon className="w-8 h-8 text-[#E0E0E0]" />
                    <h2 className="text-xl font-noto-400">비밀번호 변경</h2>
                </div>
                <form onSubmit={handlePasswordSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">현재 비밀번호</label>
                        <input name="password" type="password" value={passwordData.password} onChange={handlePasswordChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">새 비밀번호</label>
                        <input name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">새 비밀번호 확인</label>
                        <input name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div className="pt-2 text-right">
                        <button type="submit" className="font-noto-500 px-4 py-2 rounded-md bg-[rgba(111,131,175)] hover:bg-[rgba(91,111,155)]">
                            변경
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}