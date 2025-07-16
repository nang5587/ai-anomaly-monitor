'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext'; // ✨ 인증 상태를 가져올 훅
import { toast } from 'sonner';
import { KeyIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { getMyProfile, updateProfileInfo, changePassword } from '@/api/userApi'

const factoryCodeNameMap: { [key: number]: string } = {
    1: '인천',
    2: '화성',
    3: '양산',
    4: '구미',
};

export default function UserSettings() {
    const { user, updateUserContext } = useAuth(); // ✨ AuthContext에서 user 정보와 업데이트 함수를 가져옴

    // 폼 데이터를 관리할 상태
    const [formData, setFormData] = useState({ userName: '', email: '' });
    // 비밀번호 변경 폼 데이터를 관리할 상태
    const [passwordData, setPasswordData] = useState({ password: '', newPassword: '', confirmPassword: '' });

    const [originalProfile, setOriginalProfile] = useState({ userName: '', email: '' });
    const [isProfileChanged, setIsProfileChanged] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            // AuthContext의 user가 로드된 후에 실행
            if (user) {
                setIsLoading(true);
                try {
                    // API는 토큰으로 사용자를 식별하므로 인자가 필요 없습니다.
                    const profileFromServer = await getMyProfile();
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
    }, [user]);

    // 폼 데이터가 변경될 때마다 원본과 비교
    useEffect(() => {
        const hasChanged = formData.userName !== originalProfile.userName || formData.email !== originalProfile.email;
        setIsProfileChanged(hasChanged);
    }, [formData, originalProfile]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // 프로필 정보 저장
    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isProfileChanged) return;

        toast.loading("프로필을 업데이트하는 중...");
        try {
            await updateProfileInfo({ userName: formData.userName, email: formData.email });
            toast.success("프로필이 성공적으로 업데이트되었습니다.");
            updateUserContext({ userName: formData.userName }); // AuthContext의 이름은 실제 이름으로 업데이트하지 않음 (ID이므로)
            setOriginalProfile(formData); // 원본 데이터 갱신
        } catch (error) {
            toast.error("프로필 업데이트에 실패했습니다.");
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!passwordData.password || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("모든 비밀번호 필드를 입력해주세요.");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("새 비밀번호가 일치하지 않습니다."); return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error("새 비밀번호는 8자 이상이어야 합니다.");
            return;
        }

        // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        // if (!passwordRegex.test(passwordData.newPassword)) {
        //     toast.error("비밀번호는 8자 이상의 영문과 숫자를 포함해야 합니다.");
        //     return;
        // }

        toast.loading("비밀번호를 변경하는 중...");
        try {
            await changePassword({
                password: passwordData.password,
                newPassword: passwordData.newPassword,
            });
            toast.success("비밀번호가 성공적으로 변경되었습니다.");
            setPasswordData({ password: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            // apiClient에서 에러 처리를 하므로 여기서는 추가 토스트가 필요 없을 수 있습니다.
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
                <div className="flex items-center gap-4 mb-6">
                    <UserCircleIcon className="w-8 h-8 text-[#E0E0E0}" />
                    <h2 className="text-xl font-coto-400">프로필</h2>
                </div>
                <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0] mb-1">아이디</label>
                        <input name="userId" type="text" value={user?.userId || ''} readOnly className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0} mb-1">소속 공장</label>
                        <input name="factory" type="text" value={factoryName} readOnly className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0} mb-1">이름</label>
                        <input name="userName" type="text" value={formData.userName} onChange={handleProfileChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0} mb-1">이메일</label>
                        <input name="email" type="email" value={formData.email} onChange={handleProfileChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div className="pt-2 text-right">
                        <button type="submit" disabled={!isProfileChanged} className="font-noto-500 px-4 py-2 rounded-md bg-[rgba(111,131,175)] hover:bg-[rgba(91,111,155)] disabled:bg-gray-600 disabled:cursor-not-allowed">
                            저장
                        </button>
                    </div>
                </form>
            </div>

            {/* 비밀번호 변경 섹션 */}
            <div className="bg-[rgba(30,30,30)] p-6 rounded-2xl w-1/2">
                <div className="flex items-center gap-4 mb-6">
                    <KeyIcon className="w-8 h-8 text-[#E0E0E0}" />
                    <h2 className="text-xl font-noto-400">비밀번호 변경</h2>
                </div>
                <form onSubmit={handlePasswordSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0} mb-1">현재 비밀번호</label>
                        <input name="password" type="password" value={passwordData.password} onChange={handlePasswordChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0} mb-1">새 비밀번호</label>
                        <input name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full bg-[rgba(20,20,20)] border-none rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0} mb-1">새 비밀번호 확인</label>
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