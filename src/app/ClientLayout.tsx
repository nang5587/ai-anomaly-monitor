"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const sidebarWidth = sidebarHovered ? 208 : 64;

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar hovered={sidebarHovered} setHovered={setSidebarHovered} />

            <div
                className="flex flex-col flex-1"
                style={{ width: `calc(100vw - ${sidebarWidth}px)` }}
            >
                <Header sidebarWidth={sidebarWidth} />

                <main
                    className="h-[calc(100vh-56px)] overflow-auto bg-white px-6 py-4"
                    style={{ width: `calc(100vw - ${sidebarWidth}px)` }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
