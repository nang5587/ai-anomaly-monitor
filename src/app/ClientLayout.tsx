"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import { useAuth } from "@/context/AuthContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [sidebarHovered, setSidebarHovered] = useState(false);
    // const { user } = useAuth(); ℹ️ 백엔드 연결 시 주석 해제

    // ⚠️백엔드 연결 시 삭제
    const user = {
        role: "ADMIN", // 둘 중에 하나 선택해서 test 가능
        // role: "MANAGER",
    }

    if (!user) {
        return (
            <div className="bg-black h-screen flex items-center justify-center">
                {/* 또는 Header만 있는 로딩 화면을 보여줄 수도 있습니다. */}
                <p className="text-white">사용자 정보를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="bg-black">
            <Header />

            <div className="flex">
                <Sidebar userRole={user.role as 'ADMIN' | 'MANAGER'} hovered={sidebarHovered} setHovered={setSidebarHovered} />

                <main className="flex-1 h-screen pt-20 overflow-hidden">
                    <div className="w-full h-full">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
