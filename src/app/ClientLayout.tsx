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
    const { user } = useAuth(); // ℹ️ 백엔드 연결 시 주석 해제

    // ⚠️백엔드 연결 시 삭제
    // const user = {
    //     role: "ADMIN", // 둘 중에 하나 선택해서 test 가능
    //     // role: "MANAGER",
    // }


    const [sidebarHovered, setSidebarHovered] = useState(false);

    // const isMapPage = pathname === '/graph';
    // const mapData = useMapData();

    if (!user) {
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

                <main className={`flex-1 h-screen overflow-hidden relative ${
                    statusBar.visible ? 'pt-0' : 'pt-20'
                }`}>
                    {children}
                </main>

            </div>
        </div>
    );
}
