'use client';

import { useState, useEffect, useMemo } from 'react';
import { ApprovalModal } from './ApprovalModal';
import { toast } from 'sonner';
import { UserPlusIcon, UserMinusIcon, ArchiveBoxXMarkIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

import { dummyAllUsers, type User, type UserStatus, type UserRole } from './dummyData';

const FACTORY_NAME_MAP: { [key: string]: string } = {
    '1': '인천공장',
    '2': '화성공장',
    '3': '양산공장',
    '4': '구미공장',
};

const StatusToggle = ({ isActive, onClick }: { isActive: boolean; onClick: () => void; }) => {
    return (
        <button
            onClick={onClick}
            className={`cursor-pointer relative inline-flex items-center h-6 rounded-full p-1 w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(111,131,175)]`}
        >
            <span className="sr-only">Toggle Status</span>
            <span
                className={`${isActive ? 'bg-[rgba(111,131,175)]' : 'bg-gray-500'} absolute inset-0 rounded-full`}
                aria-hidden="true"
            />
            <span
                className={`${isActive ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
                aria-hidden="true"
            />
        </button>
    );
};

type ActiveTab = 'pending' | 'active' | 'rejected' | 'deleted';

export default function UserManagementClient() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
    const [allUsers, setAllUsers] = useState<User[]>(dummyAllUsers);

    const [isLoading, setIsLoading] = useState(false);

    // API 연동 시 사용할 함수들 (현재는 주석 처리)
    /*
    const [isProcessing, startTransition] = useTransition();

    const fetchAllUsers = async () => {
        setIsLoading(true);
        try {
            // const response = await getUsers(); // GET /admin/users
            // setAllUsers(response.users);
        } catch (error) {
            toast.error('사용자 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const updateUserStatus = async (userId: string, status: UserStatus) => {
        startTransition(async () => {
            try {
                // await patchUserStatus(userId, status); // PATCH /admin/users/{userId}
                toast.success('사용자 상태가 변경되었습니다.');
                await fetchAllUsers(); // 목록 새로고침
            } catch (error) {
                toast.error('처리 중 오류가 발생했습니다.');
            }
        });
    };
    */

    // *️⃣--- 더미 데이터용 로직 (백엔드 연결 시 위 로직으로 교체) ---*️⃣
    const updateUser = (userId: string, newStatus: UserStatus, newRole?: User['role']) => {
        setIsLoading(true);
        setTimeout(() => {
            setAllUsers(prevUsers =>
                prevUsers.map(user =>
                    user.userId === userId
                        ? { ...user, status: newStatus, role: newRole || user.role }
                        : user
                )
            );
            toast.success('사용자 정보가 업데이트되었습니다.');
            setIsLoading(false);
        }, 300);
    };

    const handleApprove = (user: User) => { if (confirm(`'${user.userName}'님을 승인하시겠습니까?`)) { updateUser(user.userId, 'active', 'MANAGER'); } };
    const handleReject = (user: User) => { if (confirm(`'${user.userName}'님의 요청을 거절하시겠습니까?`)) { updateUser(user.userId, 'rejected'); } };
    const handleToggleActive = (user: User) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const actionText = newStatus === 'inactive' ? '비활성화' : '활성화';
        if (confirm(`'${user.userName}'님을 ${actionText}하시겠습니까?`)) { updateUser(user.userId, newStatus); }
    };
    const handleDelete = (user: User) => { if (confirm(`'${user.userName}'님을 삭제 처리하시겠습니까? (복구 가능)`)) { updateUser(user.userId, 'del'); } };
    const handleRestore = (user: User) => { if (confirm(`'${user.userName}'님을 '승인 대기' 상태로 복구하시겠습니까?`)) { updateUser(user.userId, 'pending', 'UNAUTH'); } };


    // 현재 탭에 따라 보여줄 사용자를 필터링
    const filteredUsers = useMemo(() => {
        if (isLoading) return [];
        switch (activeTab) {
            case 'pending':
                return allUsers.filter(u => u.status === 'pending');
            // '사용자 관리' 탭은 'active' 상태로 대표됩니다.
            case 'active':
                return allUsers.filter(u => u.status === 'active' || u.status === 'inactive');
            // '처리된 요청' 탭은 'rejected'와 'deleted' 상태로 대표됩니다.
            case 'rejected':
            case 'deleted':
                return allUsers.filter(u => u.status === 'rejected' || u.status === 'del');
            default:
                return [];
        }
    }, [activeTab, allUsers, isLoading]);

    // 각 탭에 맞는 테이블 헤더와 버튼을 렌더링
    const renderTableHeader = () => {
        let actionHeader = '관리';
        if (activeTab === 'pending') actionHeader = '승인 / 거절';
        if (activeTab === 'active') actionHeader = '상태 / 삭제';
        if (activeTab === 'rejected' || activeTab === 'deleted') actionHeader = '복구';

        return (
            <th scope="col" className="px-6 py-3 text-sm text-center font-semibold uppercase tracking-wider">
                {actionHeader}
            </th>
        );
    };

    const renderActionButtons = (user: User) => {
        switch (activeTab) {
            case 'pending':
                return (
                    <>
                        <button onClick={() => handleApprove(user)} className="p-2 text-gray-300 cursor-pointer mx-1 hover:text-green-200" title="승인"><UserPlusIcon className='w-5 h-5' /></button>
                        <button onClick={() => handleReject(user)} className='p-2 text-gray-300 cursor-pointer mx-1 hover:text-red-200' title="거절"><UserMinusIcon className='w-5 h-5' /></button>
                    </>
                );
            case 'active':
                return (
                    <div className="flex items-center justify-center gap-4">
                        <StatusToggle isActive={user.status === 'active'} onClick={() => handleToggleActive(user)} />
                        <button onClick={() => handleDelete(user)} className='p- text-gray-300 cursor-pointer mx-1 hover:text-red-400' title="삭제"><TrashIcon className='w-5 h-5' /></button>
                    </div>
                );
            case 'rejected':
            case 'deleted':
                return (
                    <button onClick={() => handleRestore(user)} className="p-2 text-gray-300 cursor-pointer mx-1 hover:text-blue-400" title="복구"><ArrowPathIcon className='w-5 h-5' /></button>
                );
            default:
                return null;
        }
    };

    const TABS: { id: ActiveTab; label: string }[] = [
        { id: 'pending', label: '승인 대기' },
        { id: 'active', label: '사용자 관리' },
        { id: 'rejected', label: '처리된 요청' },
    ];

    return (
        <div className='bg-[rgba(30,30,30)] p-4 sm:p-6 rounded-2xl w-full'>
            <div className="mb-6 inline-flex items-center rounded-2xl bg-[rgba(30,30,30)] p-1">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 text-base font-medium transition-colors ${activeTab === tab.id ? 'text-[rgba(111,131,175)] font-noto-500 border-b-2 border-b-[rgba(111,131,175)]' : 'text-gray-500 hover:text-gray-400 font-noto-500'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <p className='text-gray-300 p-4 text-center'>처리 중...</p>
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
                                        <tr key={user.userId} className="hover:bg-[rgba(20,20,20)]/40 transition-colors">
                                            <td className="px-6 py-3 text-sm whitespace-nowrap text-white text-center">{user.userName}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-center text-gray-300 font-vietnam">{user.email}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-center text-gray-300">{FACTORY_NAME_MAP[user.locationId] || '미지정'}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-center text-gray-300 font-vietnam">
                                                <span className={`px-3 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
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
        </div>
    );
}