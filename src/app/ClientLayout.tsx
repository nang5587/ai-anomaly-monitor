"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect } from "react";
import { useAtomValue } from 'jotai';
import { statusBarAtom } from '@/stores/uiAtoms';

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import { useMapStore } from '@/stores/mapStore';

import { useAuth } from "@/context/AuthContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const statusBar = useAtomValue(statusBarAtom);
    const pathname = usePathname();
    const { user, isLoading } = useAuth(); // ℹ️ 백엔드 연결 시 주석 해제

    // ⚠️백엔드 연결 시 삭제
    // const user = {
    //     role: "ADMIN", // 둘 중에 하나 선택해서 test 가능
    //     // role: "MANAGER",
    // }
    const [sidebarHovered, setSidebarHovered] = useState(false);

    const isPublicPage = pathname === '/login';

    useEffect(() => {
        // 로딩이 끝났고, 유저가 없으며, 현재 페이지가 공용 페이지가 아닐 때만 리디렉션
        if (!isLoading && !user && !isPublicPage) {
            window.location.href = '/login';
        }
    }, [user, isLoading, isPublicPage, pathname]);

    if (isPublicPage) {
        return <>{children}</>;
    }

    // --- 아래는 기존의 대시보드 레이아웃 렌더링 로직입니다 ---

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

                <main className={`flex-1 h-screen overflow-hidden relative ${statusBar.visible ? 'pt-0' : 'pt-20'
                    }`}>
                    {children}
                </main>

            </div>
        </div>
    );
}
