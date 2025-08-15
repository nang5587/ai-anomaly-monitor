'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { KeyIcon, UserCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getMyProfile, updateProfileInfo, deleteMyAccount, changePassword } from '@/api/userApi'

const factoryCodeNameMap: { [key: number]: string } = {
    1: '인천',
    2: '화성',
    3: '양산',
    4: '구미',
};

interface UserSettingsProps {
    initialProfile: {
        userName: string;
        email: string;
    };
}

export default function UserSettings({ initialProfile }: UserSettingsProps) {
    const { user, logout, updateUserContext } = useAuth();
    const [formData, setFormData] = useState(initialProfile);
    const [passwordData, setPasswordData] = useState({ password: '', newPassword: '', confirmPassword: '' });
    const [originalProfile, setOriginalProfile] = useState(initialProfile);
    const [isProfileChanged, setIsProfileChanged] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            if (user) {
                setIsLoading(true);
                try {
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

    useEffect(() => {
        const hasChanged = formData.userName !== originalProfile.userName || formData.email !== originalProfile.email;
        setIsProfileChanged(hasChanged);
    }, [formData, originalProfile]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isProfileChanged) return;

        toast.loading("프로필을 업데이트하는 중...");
        try {
            await updateProfileInfo({ userName: formData.userName, email: formData.email });
            toast.success("프로필이 성공적으로 업데이트되었습니다.");
            updateUserContext({ userName: formData.userName });
            setOriginalProfile(formData);
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
        toast.loading("비밀번호를 변경하는 중...");
        try {
            await changePassword({
                password: passwordData.password,
                newPassword: passwordData.newPassword,
            });
            toast.success("비밀번호가 성공적으로 변경되었습니다.");
            setPasswordData({ password: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        const isConfirmed = window.confirm(
            '정말로 회원 탈퇴를 진행하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
        );
        if (!isConfirmed) return;
        toast.loading("회원 탈퇴 처리 중...");
        try {
            await deleteMyAccount();
            toast.success("회원 탈퇴가 완료되었습니다. 잠시 후 로그아웃됩니다.");
            setTimeout(() => {
                logout();
            }, 1500);
        } catch (error) {
            console.error("회원 탈퇴 실패:", error);
            toast.error("회원 탈퇴 중 오류가 발생했습니다.");
        }
    };

    const factoryName = useMemo(() => {
        if (!user) return '';
        if (user.role === 'ADMIN') return '전체 관리';
        return user.locationId ? factoryCodeNameMap[user.locationId] || '미지정' : '소속 없음';
    }, [user]);

    if (!user) {
        return <div className="p-8 text-white">사용자 정보를 확인 중입니다...</div>;
    }
    if (isLoading) {
        return <div className="p-8 text-white">정보를 불러오는 중...</div>;
    }

    return (
        <div className="p-4 sm:p-8 text-white w-full flex flex-col items-center gap-10">
            <div className="w-full flex justify-center gap-10">
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

            <div className="w-full max-w-[calc(theme(maxWidth.lg)*2+2.5rem)] mt-2">
                <div className="bg-[rgba(30,30,30)] p-6 rounded-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">회원 탈퇴</h3>
                            <p className="text-gray-400 text-sm">
                                계정을 삭제하면 모든 개인 정보와 활동 내역이 영구적으로 제거됩니다.<br />
                                이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className="flex items-center gap-2 bg-[rgba(111,131,175)] hover:bg-[rgba(91,111,155)] text-white font-semibold px-4 py-2 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                        >
                            <TrashIcon className="w-5 h-5" />
                            계정 삭제
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}