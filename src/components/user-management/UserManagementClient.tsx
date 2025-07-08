// components/features/user-management/UserManagementClient.tsx

'use client';

import { useState, useEffect, useTransition } from 'react';
import { ApprovalModal } from './ApprovalModal';
// import { getUsers, rejectUser, approveUser, User } from '@/lib/actions/userManagement';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { dummyPendingUsers, dummyActiveUsers, type User } from './dummyData';

// ApproveModal에서 전달받을 데이터 타입
export type ApprovalFormData = {
    role: 'MANAGER' | 'UNAUTH';
    factoryCode?: string;
};

export default function UserManagementClient() {
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    // const [users, setUsers] = useState<User[]>([]); 🔴 백엔드 연결 시 주석 풀고 아래줄 삭제
    const [users, setUsers] = useState<User[]>(dummyPendingUsers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    // const [isLoading, startTransition] = useTransition(); 🔴 백엔드 연결 시 주석 풀기

    // 현재 탭의 사용자 목록을 불러오는 함수
    // const fetchUsers = async (tab: 'pending' | 'active') => {
    //     startTransition(async () => {
    //         try {
    //             const fetchedUsers = await getUsers({ status: tab });
    //             setUsers(fetchedUsers);
    //         } catch (error) {
    //             toast.error('사용자 목록을 불러오는 데 실패했습니다.');
    //             setUsers([]); // 에러 발생 시 목록 비우기
    //         }
    //     });
    // };

    // 컴포넌트 마운트 시 및 탭 변경 시 데이터 로드
    // useEffect(() => {
    //     fetchUsers(activeTab);
    // }, [activeTab]);
    const handleApproveClick = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };
    // const handleRejectClick = async (user: User) => {
    //     if (confirm(`정말로 '${user.userName}'님의 가입 요청을 거절하시겠습니까?`)) {
    //         startTransition(async () => {
    //             try {
    //                 await rejectUser(user.userId);
    //                 toast.success('사용자 요청을 거절했습니다.');
    //                 fetchUsers(activeTab); // 목록 새로고침
    //             } catch (error) {
    //                 toast.error('처리 중 오류가 발생했습니다.');
    //             }
    //         });
    //     }
    // };

    // // ApprovalModal에서 '최종 승인' 클릭 시 실행될 함수
    // const handleApprovalConfirm = async (formData: ApprovalFormData) => {
    //     if (!selectedUser) return;

    //     startTransition(async () => {
    //         try {
    //             await approveUser({
    //                 userId: selectedUser.userId,
    //                 role: formData.role,
    //                 factoryCode: formData.factoryCode ? Number(formData.factoryCode) : undefined,
    //             });
    //             toast.success('사용자가 승인되었습니다.');
    //             setIsModalOpen(false); // 모달 닫기
    //             fetchUsers(activeTab); // 목록 새로고침
    //         } catch (error) {
    //             toast.error('승인 처리 중 오류가 발생했습니다.');
    //         }
    //     });
    // };

    // *️⃣-----------------------백앤드 연결 시 삭제-------------------------
    const [isLoading, setIsLoading] = useState(false);
    const handleTabChange = (tab: 'pending' | 'active') => {
        setActiveTab(tab);
        setIsLoading(true);
        // 실제 네트워크처럼 보이게 하려고 약간의 딜레이를 줍니다.
        setTimeout(() => {
            if (tab === 'pending') {
                setUsers(dummyPendingUsers);
            } else {
                setUsers(dummyActiveUsers);
            }
            setIsLoading(false);
        }, 300); // 0.3초 딜레이
    };
    const handleRejectClick = (user: User) => {
        if (confirm(`정말로 '${user.userName}'님의 가입 요청을 거절하시겠습니까?`)) {
            setIsLoading(true);
            setTimeout(() => {
                toast.success(`'${user.userName}'님의 요청을 거절했습니다.`);
                // 화면에서만 해당 유저를 제거합니다.
                setUsers(prev => prev.filter(u => u.userId !== user.userId));
                setIsLoading(false);
            }, 500);
        }
    };
    const handleApprovalConfirm = (formData: ApprovalFormData) => {
        if (!selectedUser) return;

        setIsLoading(true);
        setTimeout(() => {
            toast.success(
                `'${selectedUser.userName}'님이 '${formData.role}' 역할로 승인되었습니다.` +
                (formData.role === 'MANAGER' ? ` (공장 코드: ${formData.factoryCode})` : '')
            );
            // 화면에서만 해당 유저를 제거합니다.
            setUsers(prev => prev.filter(u => u.userId !== selectedUser.userId));
            setIsModalOpen(false);
            setIsLoading(false);
        }, 500);
    };
    // *️⃣------------------------------------------------------------

    return (
        <div>
            <div className="flex space-x-2 border-b mb-4">
                <Button
                    variant={activeTab === 'pending' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('pending')}
                >
                    승인 대기
                </Button>
                <Button
                    variant={activeTab === 'active' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('active')}
                >
                    활성 사용자
                </Button>
            </div>

            {isLoading ? (
                <p>로딩 중...</p>
            ) : (
                <>
                    {users.length === 0 ? (
                        <p className="text-center text-[#E0E0E0] py-8">해당하는 사용자가 없습니다.</p>
                    ) : (
                        // 이 코드를 UserManagementClient.tsx의 테이블 렌더링 부분에 붙여넣으세요.
                        <div className="border rounded-lg overflow-hidden border-neutral-800">
                            <table className="w-full text-sm text-left text-neutral-300">
                                <thead className="bg-neutral-900">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-xs text-center font-semibold uppercase tracking-wider text-neutral-400">
                                            이름
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs text-center font-semibold uppercase tracking-wider text-neutral-400">
                                            이메일
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs text-center font-semibold uppercase tracking-wider text-neutral-400">
                                            가입 신청일
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-xs text-center font-semibold uppercase tracking-wider text-neutral-400">
                                            처리
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {users.map((user) => (
                                        <tr key={user.userId} className="bg-white hover:bg-white/90 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-white text-center">
                                                {user.userName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {new Date(user.requestedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center space-x-2">
                                                <Button size="sm" onClick={() => handleApproveClick(user)}>승인</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleRejectClick(user)}>거절</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            <ApprovalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                onConfirm={handleApprovalConfirm} // ⬅️ 승인 처리 함수를 prop으로 전달
                isSubmitting={isLoading} // ⬅️ 로딩 상태 전달
            />
        </div>
    );
}