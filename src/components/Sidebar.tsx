"use client";

import {
  HomeIcon,
  BarChartIcon,
  SettingsIcon,
  BellIcon,
  UserIcon,
  Map as MapIcon
} from "lucide-react";
import Link from "next/link";
import { useMemo } from 'react';

const menus = [
  { name: "대시보드", icon: HomeIcon, href: "/" },
  { name: "분석 리포트", icon: BarChartIcon, href: "/report" },
  { name: "분석 지도", icon: MapIcon, href: "/graph" },
  { name: "알림", icon: BellIcon, href: "/alerts" },
  { name: "설정", icon: SettingsIcon, href: "/settings" },
  { name: "사용자 관리", icon: UserIcon, href: "/supervisor/management", requiredRole: "ADMIN" },
];

interface SidebarProps {
  hovered: boolean;
  setHovered: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: 'ADMIN' | 'MANAGER';
}

export default function Sidebar({ hovered, setHovered, userRole }: SidebarProps) {
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
      className={`h-screen bg-black shadow-md transition-all duration-300 flex flex-col flex-shrink-0 pt-20 ${hovered ? "w-52" : "w-16"
        }`}
    >
      <div className="flex-1 overflow-auto px-2 py-4">
        <div className="flex flex-col space-y-4">
          {visibleMenus.map((menu) => (
            <Link
              key={menu.name}
              href={menu.href}
              className="flex items-center gap-4 py-2.5 px-4 hover:bg-[rgba(111,131,175,1)] rounded-2xl"
            >
              <menu.icon className="w-6 h-6 text-white flex-shrink-0" />
              {hovered && (
                <span className="font-noto-400 text-white whitespace-nowrap">
                  {menu.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}