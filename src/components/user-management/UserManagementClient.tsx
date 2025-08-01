'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import ChangeFactoryModal from './ChangeFactoryModal';
import { toast } from 'sonner';
import { UserPlusIcon, UserMinusIcon, TrashIcon, ArrowPathIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
// ✨ 실제 API 함수만 import 합니다.
import { updateUser, changeUserFactory, type AdminUser } from '@/api/adminApi';

import { useAtomValue, useSetAtom } from 'jotai';
// ✨ 실제 Jotai 아톰들만 import 합니다.
import { usersAtom, usersLoadingAtom, loadUsersAtom, refetchUsersAtom } from '@/stores/userAtoms';

const FACTORY_NAME_MAP: { [key: string]: string } = {
    '1': '인천공장',
    '2': '화성공장',
    '3': '양산공장',
    '4': '구미공장',
};

const StatusToggle = ({ isActive, onClick }: { isActive: boolean; onClick: () => void; }) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClick();
    };
    return (
        <button
            onClick={handleClick}
            className={`cursor-pointer relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(111,131,175)]`}
        >
            <span className="sr-only">Toggle Status</span>
            <span
                className={`${isActive ? 'bg-[rgba(111,131,175)]' : 'bg-gray-500'} absolute inset-0 rounded-full`}
                aria-hidden="true"
            />
            {/* ✨ 핵심 수정: className 대신 style 속성을 사용합니다. */}
            <span
                className="inline-block w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out"
                style={{
                    transform: isActive ? 'translateX(1.5rem)' : 'translateX(0.3rem)',
                }}
                aria-hidden="true"
            />
        </button>
    );
};

type ActiveTab = 'pending' | 'active' | 'rejected' | 'del';

// ⚠️ api 연동 시 env로 가서 false로 바꿔야 함
const USE_DUMMY_DATA = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true';

// type Props = {
//     initialUsers: AdminUser[];
// };

export default function UserManagementClient() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
    const [selectedUserForFactoryChange, setSelectedUserForFactoryChange] = useState<AdminUser | null>(null);
    const [isProcessing, startTransition] = useTransition();

    // --- Jotai 상태 사용 ---
    const isLoading = useAtomValue(usersLoadingAtom);
    const allUsers = useAtomValue(usersAtom);
    const loadUsers = useSetAtom(loadUsersAtom);
    const refetchUsers = useSetAtom(refetchUsersAtom);

    // ✨ 1. 컴포넌트가 마운트될 때 API로부터 데이터를 로드합니다.
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // --- 핸들러 함수들 (API 호출로 변경) ---
    // ✨ 핸들러의 user 타입을 AdminUser로 명확히 합니다.
    const handleUpdateUser = (user: AdminUser, updates: Partial<AdminUser>, confirmMessage: string) => {
        if (confirm(confirmMessage)) {
            startTransition(async () => {
                try {
                    await updateUser(user.userId, updates);
                    toast.success('사용자 정보가 성공적으로 업데이트되었습니다.');
                    refetchUsers();
                } catch (error) {
                    toast.error('처리 중 오류가 발생했습니다.');
                }
            });
        }
    };

    const handleApprove = (user: AdminUser) => handleUpdateUser(user, { status: 'active' }, `'${user.userName}'님을 승인하시겠습니까?`);
    const handleReject = (user: AdminUser) => handleUpdateUser(user, { status: 'rejected' }, `'${user.userName}'님의 요청을 거절하시겠습니까?`);
    const handleDelete = (user: AdminUser) => handleUpdateUser(user, { status: 'del' }, `'${user.userName}'님을 삭제 처리하시겠습니까?`);
    const handleRestore = (user: AdminUser) => handleUpdateUser(user, { status: 'pending' }, `'${user.userName}'님을 복구하시겠습니까?`);
    const handleToggleActive = (user: AdminUser) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        handleUpdateUser(user, { status: newStatus }, `'${user.userName}'님을 ${newStatus === 'inactive' ? '비활성화' : '활성화'}하시겠습니까?`);
    };

    const handleFactoryUpdateSuccess = (userId: string, newFactoryId: string) => {
        startTransition(async () => {
            try {
                await changeUserFactory(userId, Number(newFactoryId));
                toast.success('소속 공장이 변경되었습니다.');
                refetchUsers();

            } catch (error) {
                toast.error("공장 변경 중 오류가 발생했습니다.");
            }
        });
    };

    // --- 필터링 로직 (✨ 'del' 탭 조건 추가) ---
    const filteredUsers = useMemo(() => {
        if (!allUsers) return [];
        switch (activeTab) {
            case 'pending':
                return allUsers.filter(u => u.status === 'pending');
            case 'active':
                return allUsers.filter(u => u.status === 'active' || u.status === 'inactive');
            case 'rejected':
                return allUsers.filter(u => u.status === 'rejected');
            case 'del': // ✨ 'del' 상태의 사용자만 필터링하는 탭
                return allUsers.filter(u => u.status === 'del');
            default:
                return [];
        }
    }, [activeTab, allUsers]);

    // --- 렌더링 함수들 ---
    const renderTableHeader = () => {
        let actionHeader = '관리';
        if (activeTab === 'pending') actionHeader = '승인 / 거절';
        if (activeTab === 'active') actionHeader = '상태 / 삭제';
        if (activeTab === 'rejected' || activeTab === 'del') actionHeader = '복구';

        return (
            <th scope="col" className="px-6 py-3 text-sm text-center font-semibold uppercase tracking-wider">
                {actionHeader}
            </th>
        );
    };

    const renderActionButtons = (user: AdminUser) => {
        switch (activeTab) {
            case 'pending':
                return (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); handleApprove(user); }} className="p-2 text-gray-300 cursor-pointer mx-1 hover:text-green-200" title="승인"><UserPlusIcon className='w-5 h-5' /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(user); }} className='p-2 text-gray-300 cursor-pointer mx-1 hover:text-red-200' title="거절"><UserMinusIcon className='w-5 h-5' /></button>
                    </>
                );
            case 'active':
                return (
                    <div className="flex items-center justify-center gap-4">
                        <StatusToggle isActive={user.status === 'active'} onClick={() => handleToggleActive(user)} />
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(user); }} className='p-2 text-gray-300 cursor-pointer mx-1 hover:text-red-400' title="삭제"><TrashIcon className='w-5 h-5' /></button>
                    </div>
                );
            case 'rejected':
            case 'del':
                return (
                    <button onClick={(e) => { e.stopPropagation(); handleRestore(user); }} className="p-2 text-gray-300 cursor-pointer mx-1 hover:text-blue-400" title="복구"><ArrowPathIcon className='w-5 h-5' /></button>
                );
            default:
                return null;
        }
    };

    const TABS: { id: ActiveTab; label: string }[] = [
        { id: 'pending', label: '승인 대기' },
        { id: 'active', label: '사용자 관리' },
        { id: 'rejected', label: '처리된 요청' },
        { id: 'del', label: '삭제된 사용자' },
    ];

    // --- 최종 JSX 리턴 ---
    return (
        <div className='relative bg-[rgba(30,30,30)] p-4 sm:p-6 rounded-2xl w-full'>
            <div className="mb-6 inline-flex items-center rounded-2xl bg-[rgba(30,30,30)] p-1">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 text-base font-medium transition-colors ${activeTab === tab.id ? 'text-[rgba(111,131,175)] font-noto-500 border-b-2 border-b-[rgba(111,131,175)]' : 'text-gray-500 hover:text-gray-400 font-noto-500'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-2xl">
                    <p className="text-white text-lg animate-pulse">처리 중...</p>
                </div>
            )}


            {isLoading ? (
                <p className='text-gray-300 p-4 text-center'>사용자 목록을 불러오는 중...</p>
            ) : (
                <>
                    {filteredUsers.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">해당하는 사용자가 없습니다.</p>
                    ) : (
                        <div className="rounded-lg overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-white bg-[rgba(20,20,20)]/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-sm text-center font-semibold uppercase tracking-wider">이름</th>
                                        <th scope="col" className="px-6 py-3 text-sm text-center font-semibold uppercase tracking-wider">이메일</th>
                                        <th scope="col" className="px-6 py-3 text-sm text-center font-semibold uppercase tracking-wider whitespace-nowrap">소속 공장</th>
                                        <th scope="col" className="px-6 py-3 text-sm text-center font-semibold uppercase tracking-wider">상태</th>
                                        {renderTableHeader()}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/10">
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.userId}
                                            className="hover:bg-[rgba(20,20,20)]/40 transition-colors"
                                        >
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-white text-center">{user.userName}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-center text-gray-300 font-vietnam">{user.email}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-center text-gray-300">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>{FACTORY_NAME_MAP[user.locationId] || '미지정'}</span>

                                                    {/* '사용자 관리' 탭이고, active/inactive 상태일 때만 아이콘 표시 */}
                                                    {(activeTab === 'active' && (user.status === 'active' || user.status === 'inactive')) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // 행의 다른 이벤트 방지
                                                                setSelectedUserForFactoryChange(user);
                                                            }}
                                                            className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-white"
                                                            title="소속 공장 변경"
                                                        >
                                                            <PencilSquareIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        user.status === 'inactive' ? 'bg-gray-200 text-gray-800' :
                                                            user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center whitespace-nowrap">
                                                {renderActionButtons(user)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {selectedUserForFactoryChange && (
                <ChangeFactoryModal
                    user={selectedUserForFactoryChange}
                    onClose={() => setSelectedUserForFactoryChange(null)}
                    onSuccess={handleFactoryUpdateSuccess}
                />
            )}
        </div>
    );
}