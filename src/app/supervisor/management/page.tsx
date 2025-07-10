import UserManagementClient from "@/components/user-management/UserManagementClient"
import { Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import Image from "next/image";

export default function page() {
    return (
        <div className="w-full h-full p-4">
            <div className="w-full h-full bg-[#ffffff] p-10 rounded-3xl border-[3px] border-[#d8d6d62d]">
                <div className="flex items-center mb-20 gap-4">
                    {/* <Image src='/images/management.png' width={100} height={100} alt="사용자 관리 아이콘" className="bg-[#f6f6f6] p-2 rounded-2xl" /> */}
                    <div className="flex flex-col justify-center gap-1">
                        <h1 className="text-black text-4xl font-vietnam">Management</h1>
                        <span className="text-black/70">사용자의 가입 요청을 승인하거나 거절하고, 기존 사용자를 관리할 수 있는 관리자 전용 페이지입니다.</span>
                    </div>
                </div>

                <UserManagementClient />
            </div>
        </div>
    )
}
