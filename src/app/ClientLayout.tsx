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
    const { user, isLoading } = useAuth();

    const [sidebarHovered, setSidebarHovered] = useState(false);
    const refetchUsers = useSetAtom(refetchUsersAtom);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            refetchUsers();
            const intervalId = setInterval(() => {
                console.log('사용자 목록을 주기적으로 새로고침합니다.');
                refetchUsers();
            }, 60000);
            return () => clearInterval(intervalId);
        }
    }, [user, refetchUsers]);

    const isPublicPage = PUBLIC_ROUTES.includes(pathname);

    useEffect(() => {
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

    if (isLoading || !user) {
        return (
            <div className="bg-black h-screen flex items-center justify-center">
                <p className="text-white"></p>
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
