"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect } from "react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import StatusBar from '@/components/upload/StatusBar';
import { useSetAtom } from 'jotai';

import { useAuth } from "@/context/AuthContext";
import { refetchUsersAtom } from '@/stores/userAtoms';

const PUBLIC_ROUTES = ['/','/login', '/join'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isLoading } = useAuth(); // ℹ️ 백엔드 연결 시 주석 해제

    // ⚠️백엔드 연결 시 삭제
    // const user = {
    //     role: "ADMIN", // 둘 중에 하나 선택해서 test 가능
    //     // role: "MANAGER",
    // }

    const [sidebarHovered, setSidebarHovered] = useState(false);
    const refetchUsers = useSetAtom(refetchUsersAtom);

    useEffect(() => {
        // ADMIN 역할일 때만 주기적으로 사용자 목록을 새로고침합니다.
        if (user?.role === 'ADMIN') {
            // 컴포넌트 마운트 시 즉시 한 번 실행
            refetchUsers();

            const intervalId = setInterval(() => {
                console.log('사용자 목록을 주기적으로 새로고침합니다.');
                refetchUsers();
            }, 60000); // 60초(1분)마다 실행

            // 컴포넌트 언마운트 시 인터벌 정리
            return () => clearInterval(intervalId);
        }
    }, [user, refetchUsers]);

    const isPublicPage = PUBLIC_ROUTES.includes(pathname);

    useEffect(() => {
        // 로딩이 끝났고, 유저가 없으며, 현재 페이지가 공용 페이지가 아닐 때만 리디렉션
        if (!isLoading && !user && !isPublicPage) {
            window.location.href = '/login';
        }

        if (!isLoading && user && isPublicPage) {
            const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';
            window.location.href = `/${role}`;
        }

    }, [user, isLoading, isPublicPage, pathname]);

    if (isPublicPage) {
        return (
            <div className="bg-black">
                <Header />

                <div className="flex">
                    <main className={`flex-1 h-screen overflow-hidden relative pt-20`}>
                        {children}
                    </main>

                </div>
            </div>
        );
    }

    // 로딩 중이거나 (리디렉션 되기 전의) 유저가 없는 상태를 표시
    if (isLoading || !user) {
        return (
            <div className="bg-black h-screen flex items-center justify-center">
                <p className="text-white">사용자 정보를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="bg-black">
            <Header />

            <div className="flex">
                <Sidebar userRole={user.role as 'ADMIN' | 'MANAGER'} hovered={sidebarHovered} setHovered={setSidebarHovered} />

                <main className={`flex-1 h-screen overflow-hidden relative pt-20`}>
                    {children}
                </main>

            </div>

            <StatusBar />
        </div>
    );
}
