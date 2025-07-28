"use client";

import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { statusBarAtom } from '@/stores/uiAtoms';
import { Suspense } from 'react';
import { pendingUserCountAtom } from '@/stores/userAtoms';

import {
  HomeIcon,
  BarChartIcon,
  SettingsIcon,
  BellIcon,
  UserIcon,
  UploadCloud,
  History,
  Map as MapIcon
} from "lucide-react";
import Link from "next/link";
import { useMemo } from 'react';

const menus = [
  { name: "대시보드", icon: HomeIcon, href: "/" },
  { name: "AI 분석 리포트", icon: BarChartIcon, href: "/report" },
  { name: "AI 분석 지도", icon: MapIcon, href: "/graph" },
  { name: "CSV 업로드", icon: UploadCloud, href: "/upload" },
  { name: "CSV 목록", icon: History, href: "/filelist" },
  { name: "설정", icon: SettingsIcon, href: "/settings" },
  { name: "사용자 관리", icon: UserIcon, href: "/supervisor/management", requiredRole: "ADMIN" },
];

interface SidebarProps {
  hovered: boolean;
  setHovered: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: 'ADMIN' | 'MANAGER';
}

function NotificationBadge() {
  const pendingCount = useAtomValue(pendingUserCountAtom);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // 컴포넌트가 클라이언트에서 마운트된 후에 isClient 상태를 true로 변경
    setIsClient(true);
  }, []);

  if (!isClient || pendingCount === 0) {
    return null;
  }

  return (
    <span
      className="absolute top-0 right-0 w-3 h-3 bg-[rgba(111,131,175)] border-2 border-black rounded-full"
      title={`${pendingCount}명의 승인 대기 중`}
    ></span>
  );
}

export default function Sidebar({ hovered, setHovered, userRole }: SidebarProps) {
  const statusBar = useAtomValue(statusBarAtom);
  const visibleMenus = useMemo(() => {
    return menus.filter(menu => {
      if (!menu.requiredRole) {
        return true;
      }
      return menu.requiredRole === userRole;
    });
  }, [userRole]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`h-screen bg-black shadow-md transition-all duration-300 flex flex-col flex-shrink-0 ${statusBar.visible ? 'pt-0' : 'pt-20'
        } ${hovered ? "w-52" : "w-16"
        }`}
    >
      <div className="flex-1 overflow-auto hide-scrollbar px-2 py-4">
        <div className="flex flex-col space-y-4">
          {visibleMenus.map((menu) => {
            let href = menu.href;

            if (menu.name === 'AI 분석 리포트') {
              if (userRole === 'ADMIN') {
                href = '/supervisor/report';
              } else if (userRole === 'MANAGER') {
                href = '/admin/report';
              }
            }

            return (
              <Link
                key={menu.name}
                href={href}
                className={`relative flex items-center ${!hovered && "justify-center"} gap-4 py-2.5 px-4 hover:bg-[rgba(111,131,175,1)] rounded-xl`}
              >
                <menu.icon className="w-6 h-6 text-white flex-shrink-0" />
                {hovered && (
                  <span className="font-noto-400 text-white whitespace-nowrap">
                    {menu.name}
                  </span>
                )}

                {menu.name === '사용자 관리' && (
                  <Suspense fallback={null}>
                    <NotificationBadge />
                  </Suspense>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}