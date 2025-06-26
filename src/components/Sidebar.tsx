"use client";

import {
  HomeIcon,
  BarChartIcon,
  SettingsIcon,
  BellIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const menus = [
  { name: "대시보드", icon: HomeIcon, href: "/" },
  { name: "분석 리포트", icon: BarChartIcon, href: "/report" },
  { name: "알림", icon: BellIcon, href: "/alerts" },
  { name: "설정", icon: SettingsIcon, href: "/settings" },
  { name: "사용자", icon: UserIcon, href: "/users" },
];

interface SidebarProps {
  hovered: boolean;
  setHovered: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({hovered, setHovered}: SidebarProps) {
  // const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white shadow-md transition-all duration-300 h-screen flex flex-col
        ${hovered ? "w-52" : "w-16"}`}
    >
      <div className="flex-1 overflow-auto px-2 py-4">
        <div className="flex flex-col space-y-4">
          {menus.map((menu) => (
            <Link
              key={menu.name}
              href={menu.href}
              className="flex items-center gap-4 p-2 hover:bg-blue-100 rounded-md"
            >
              <menu.icon className="w-6 h-6 text-gray-700 flex-shrink-0" />
              {hovered && (
                <span className="text-gray-800 whitespace-nowrap">
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