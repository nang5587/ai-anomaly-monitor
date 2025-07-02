"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [sidebarHovered, setSidebarHovered] = useState(false);

    return (
        <div className="bg-black">
            <Header />

            <div className="flex">
                <Sidebar hovered={sidebarHovered} setHovered={setSidebarHovered} />

                <main className="flex-1 h-screen pt-20 overflow-hidden">
                    <div className="w-full h-full"> {/* 내부 컨텐츠에 패딩 적용 */}
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
