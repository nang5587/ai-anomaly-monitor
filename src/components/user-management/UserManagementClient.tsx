'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import ChangeFactoryModal from './ChangeFactoryModal';
import { toast } from 'sonner';
import { UserPlusIcon, UserMinusIcon, NoSymbolIcon, ArrowPathIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon, EnvelopeIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { updateUser, changeUserFactory, type AdminUser } from '@/api/adminApi';
import { useAtomValue, useSetAtom } from 'jotai';
import { usersAtom, usersLoadingAtom, loadUsersAtom, refetchUsersAtom } from '@/stores/userAtoms';
import { Pagination } from '../ui/Pagination';

const FACTORY_NAME_MAP: { [key: string]: string } = {
    '1': '인천공장',
    '2': '화성공장',
    '3': '양산공장',
    '4': '구미공장',
};

const UserCard = ({ user, activeTab, onApprove, onReject, onDelete, onRestore, onToggleActive, onEditFactory }: {
    user: AdminUser;
    activeTab: ActiveTab;
    onApprove: (user: AdminUser) => void;
    onReject: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    onRestore: (user: AdminUser) => void;
    onToggleActive: (user: AdminUser) => void;
    onEditFactory: (user: AdminUser) => void;
}) => {
    
    const renderActionButtons = () => {
        switch (activeTab) {
            case 'pending': return (
                <>
                    <button onClick={() => onApprove(user)} className="flex-1 bg-[rgba(30,30,30)] text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"><UserPlusIcon className='w-5 h-5' /> 승인</button>
                    <button onClick={() => onReject(user)} className="flex-1 bg-[rgba(30,30,30)] text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"><UserMinusIcon className='w-5 h-5' /> 거절</button>
                </>
            );
            case 'active': return (
                <div className="flex w-full items-center justify-center gap-2">
                    <StatusToggle isActive={user.status === 'active'} onClick={() => onToggleActive(user)} />
                    <span className='text-sm text-[#E0E0E0]'>{user.status === 'active' ? '활성' : '비활성'}</span>
                    <div className='flex-grow' />
                    <button onClick={() => onDelete(user)} className='p-2 text-gray-400 hover:text-red-400 hover:underline cursor-pointer' title="삭제">사용자 삭제</button>
                </div>
            );
            case 'rejected':
            case 'del': return (
                <button onClick={() => onRestore(user)} className="w-full bg-[rgba(30,30,30)] hover:bg-blue-200 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"><ArrowPathIcon className='w-5 h-5' /> 복구</button>
            );
            default: return null;
        }
    };

    const statusInfo = {
        active: { text: '활성', color: 'bg-green-400' },
        inactive: { text: '비활성', color: 'bg-gray-400' },
        pending: { text: '승인 대기', color: 'bg-yellow-300' },
        rejected: { text: '거절됨', color: 'bg-red-400' },
        del: { text: '삭제됨', color: 'bg-gray-400' },
    }[user.status];

    return (
        <div className="bg-[rgba(50,50,50)] rounded-xl shadow-lg p-6 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-200 ease-in-out">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className='flex items-center gap-3'>
                        <UserCircleIcon className="w-10 h-10 text-gray-400" />
                        <div>
                            <h3 className="text-lg font-noto-500 text-white">{user.userName}</h3>
                            <p className="text-sm text-gray-400 font-vietnam">{user.role}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 text-xs text-white rounded-full border-2 border-blue-300`}>
                        {statusInfo.text}
                    </span>
                </div>
                
                <div className="space-y-3 text-sm text-gray-300">
                    <p className="flex items-center gap-3"><EnvelopeIcon className="w-5 h-5 text-gray-500"/> {user.email}</p>
                    <div className="flex items-center gap-3">
                        <BuildingOffice2Icon className="w-5 h-5 text-gray-500"/>
                        <span>{FACTORY_NAME_MAP[user.locationId] || '미지정'}</span>
                        {(activeTab === 'active') && (
                            <button onClick={() => onEditFactory(user)} className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer" title="소속 공장 변경">
                                <p className='flex items-center gap-1'><PencilSquareIcon className="w-4 h-4" />변경</p>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-4">
                {renderActionButtons()}
            </div>
        </div>
    );
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

export default function UserManagementClient() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
    const [selectedUserForFactoryChange, setSelectedUserForFactoryChange] = useState<AdminUser | null>(null);
    const [isProcessing, startTransition] = useTransition();

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const isLoading = useAtomValue(usersLoadingAtom);
    const allUsers = useAtomValue(usersAtom);
    const loadUsers = useSetAtom(loadUsersAtom);
    const refetchUsers = useSetAtom(refetchUsersAtom);

    // useEffect(() => {
    //     loadUsers();
    // }, [loadUsers]);

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

    // const handleFactoryUpdateSuccess = (userId: string, newFactoryId: string) => {
    //     startTransition(async () => {
    //         try {
    //             await changeUserFactory(userId, Number(newFactoryId));
    //             toast.success('소속 공장이 변경되었습니다.');
    //             refetchUsers();

    //         } catch (error) {
    //             toast.error("공장 변경 중 오류가 발생했습니다.");
    //         }
    //     });
    // };

    const handleFactoryUpdateSuccess = () => refetchUsers();

    const filteredUsers = useMemo(() => {
        if (!allUsers) return [];
        switch (activeTab) {
            case 'pending':
                return allUsers.filter(u => u.status === 'pending');
            case 'active':
                return allUsers.filter(u => u.status === 'active' || u.status === 'inactive');
            case 'rejected':
                return allUsers.filter(u => u.status === 'rejected');
            case 'del':
                return allUsers.filter(u => u.status === 'del');
            default:
                return [];
        }
    }, [activeTab, allUsers]);

    const totalPages = useMemo(() => Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), [filteredUsers]);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const TABS: { id: ActiveTab; label: string }[] = [
        { id: 'pending', label: '승인 대기' },
        { id: 'active', label: '사용자 관리' },
        { id: 'rejected', label: '거절한 요청' },
        { id: 'del', label: '삭제된 사용자' },
    ];

    return (
        <div className='relative bg-[rgba(30,30,30)] p-4 sm:p-6 rounded-2xl w-full font-noto-400'>
            <div className="mb-6 inline-flex items-center rounded-2xl bg-[rgba(30,30,30)] p-1">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 text-base font-medium transition-colors ${activeTab === tab.id ? 'text-[rgba(111,131,175)] font-noto-500 border-b-2 border-b-[rgba(111,131,175)]' : 'text-gray-500 hover:text-gray-400 font-noto-500'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl">
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
                        <div className="min-h-[600px] flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {paginatedUsers.map((user) => (
                                    <UserCard
                                        key={user.userId}
                                        user={user}
                                        activeTab={activeTab}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onDelete={handleDelete}
                                        onRestore={handleRestore}
                                        onToggleActive={handleToggleActive}
                                        onEditFactory={setSelectedUserForFactoryChange}
                                    />
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-8 flex justify-center">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
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