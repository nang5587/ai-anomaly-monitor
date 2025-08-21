'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';

import { getMyProfile, updateProfileInfo, deleteMyAccount, changePassword } from '@/api/userApi'
import apiClient, { getFiles_client, markFileAsDeleted } from '@/api/apiClient';
import { selectedFileIdAtom } from "@/stores/mapDataAtoms";
import { FileItem } from "@/types/file";

import { KeyIcon, TrashIcon } from '@heroicons/react/24/outline';
import { LayoutDashboard, Download, Trash2, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

const factoryCodeNameMap: { [key: number]: string } = {
    1: '인천',
    2: '화성',
    3: '양산',
    4: '구미',
};


export default function UserSettings() {
    const { user, logout, updateUserContext } = useAuth();
    const [formData, setFormData] = useState({ userName: '', email: '' });
    const [passwordData, setPasswordData] = useState({ password: '', newPassword: '', confirmPassword: '' });
    const [originalProfile, setOriginalProfile] = useState({ userName: '', email: '' });
    const [isProfileChanged, setIsProfileChanged] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const [files, setFiles] = useState<FileItem[]>([]);
    const [isFilesLoading, setIsFilesLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    const setFileId = useSetAtom(selectedFileIdAtom);
    const router = useRouter();

    useEffect(() => {
        async function fetchInitialData() {
            if (user) {
                setIsProfileLoading(true);
                setIsFilesLoading(true);
                try {
                    const [profileFromServer, filesFromServer] = await Promise.all([
                        getMyProfile(),
                        getFiles_client()
                    ]);

                    setFormData(profileFromServer);
                    setOriginalProfile(profileFromServer);
                    setFiles(filesFromServer);

                } catch (error) {
                    toast.error("마이페이지 정보를 불러오는 데 실패했습니다.");
                    console.error("데이터 로딩 실패:", error);
                } finally {
                    setIsProfileLoading(false);
                    setIsFilesLoading(false);
                }
            }
        }
        fetchInitialData();
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

    const handleFileSelect = (fileId: number) => {
        if (!user || !user.role) {
            toast.error("사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
            router.push('/login');
            return;
        }
        setFileId(fileId);
        const dashboardPath = user.role.toUpperCase() === 'ADMIN' ? '/supervisor' : '/admin';
        router.push(`${dashboardPath}?fileId=${fileId}`);
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        try {
            const response = await apiClient.get(`/manager/download/${fileId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`'${fileName}' 다운로드를 시작합니다.`);
        } catch (error) {
            console.error("파일 다운로드 실패:", error);
            toast.error("파일 다운로드 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (fileId: number, fileName: string) => {
        if (!window.confirm(`'${fileName}' 파일을 정말로 삭제하시겠습니까?`)) return;
        try {
            await markFileAsDeleted(fileId);
            setFiles(prevFiles => prevFiles.filter(file => file.fileId !== fileId));
            toast.success(`'${fileName}' 파일이 삭제되었습니다.`);
        } catch (error) {
            console.error("파일 삭제 실패:", error);
            toast.error("파일 삭제 중 오류가 발생했습니다.");
        }
    };

    const factoryName = useMemo(() => {
        if (!user) return '';
        if (user.role === 'ADMIN') return '전체 관리';
        return user.locationId ? factoryCodeNameMap[user.locationId] || '미지정' : '소속 없음';
    }, [user]);

    const filteredFiles = useMemo(() => files.filter(file =>
        file.fileName.toLowerCase().includes(search.toLowerCase())
    ), [files, search]);

    const totalPages = Math.ceil(filteredFiles.length / rowsPerPage);
    const displayedFiles = filteredFiles.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    if (isProfileLoading || !user) {
        return <div className="p-8 text-white text-center">사용자 정보를 불러오는 중입니다...</div>;
    }

    return (
        <div className="p-4 sm:p-8 text-white w-full max-w-7xl mx-auto flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col bg-[rgba(30,30,30)] p-6 rounded-2xl">
                    <div className="flex items-center gap-5 mb-6">
                        <img
                            src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${user.userId}`}
                            alt="User Avatar"
                            className="w-20 h-20 rounded-full bg-gray-700 border-2 border-gray-500"
                        />
                        <div>
                            <h2 className="text-2xl font-bold">{user.userId}</h2>
                            <p className="text-gray-400">{factoryName}</p>
                        </div>
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

                <div className="bg-[rgba(30,30,30)] p-6 rounded-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <KeyIcon className="w-8 h-8 text-[#E0E0E0}" />
                        <h2 className="text-xl font-semibold">비밀번호 변경</h2>
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
            <div className="bg-[rgba(30,30,30)] p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">파일 업로드 이력</h2>
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            placeholder="파일명으로 검색..."
                            className="w-64 pl-10 pr-4 py-2 text-sm text-white bg-[rgba(40,40,40)] border border-[rgba(111,131,175)] rounded-lg focus:outline-none"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="text-sm font-medium text-white uppercase border-b-2 border-b-[rgba(111,131,175)]">
                            <tr>
                                <th scope="col" className="px-6 py-3">파일명</th>
                                <th scope="col" className="px-6 py-3">업로더</th>
                                <th scope="col" className="px-6 py-3">크기</th>
                                <th scope="col" className="px-6 py-3">업로드 시간</th>
                                <th scope="col" className="px-6 py-3 text-center">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {isFilesLoading ? (
                                <tr><td colSpan={5} className="text-center py-10">파일 목록을 불러오는 중...</td></tr>
                            ) : displayedFiles.length > 0 ? (
                                displayedFiles.map((file) => (
                                    <tr key={file.fileId} className="hover:bg-[rgba(40,40,40)]">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{file.fileName}</td>
                                        <td className="px-6 py-4">{file.userId}</td>
                                        <td className="px-6 py-4">{(file.fileSize / 1024).toFixed(1)} KB</td>
                                        <td className="px-6 py-4">{new Date(file.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => handleFileSelect(file.fileId)} className="p-2 rounded-lg hover:bg-[rgba(55,55,55)]" title="대시보드 보기"><LayoutDashboard className="h-4 w-4 text-blue-300" /></button>
                                                <button onClick={() => handleDownload(file.fileId, file.fileName)} className="p-2 rounded-lg hover:bg-[rgba(55,55,55)]" title="다운로드"><Download className="h-4 w-4 text-green-300" /></button>
                                                <button onClick={() => handleDelete(file.fileId, file.fileName)} className="p-2 rounded-lg hover:bg-[rgba(55,55,55)]" title="삭제"><Trash2 className="h-4 w-4 text-red-300" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center py-10">{search ? `"${search}"에 대한 검색 결과가 없습니다.` : "업로드된 파일이 없습니다."}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-end pt-4">
                    <span className="text-sm text-gray-400 mr-4">총 {filteredFiles.length}개</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-40 hover:bg-gray-600"><ChevronLeftIcon className="w-4 h-4" /></button>
                        <span className="text-sm font-semibold">{currentPage} / {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-md disabled:opacity-40 hover:bg-gray-600"><ChevronRightIcon className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>


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

    );
}