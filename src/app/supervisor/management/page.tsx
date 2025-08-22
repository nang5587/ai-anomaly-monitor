import UserManagementClient from "@/components/user-management/UserManagementClient"
import { getUsers_server } from "@/api/apiServer";

export default async function page() {
    const users = await getUsers_server();

    return (
        <div className="w-full h-full">
            <div className="w-full h-full bg-[rgba(40,40,40)] p-10">
                <div className="flex items-center mb-20 gap-4">
                    <div className="flex flex-col justify-center gap-1">
                        <h1 className="text-white text-4xl font-vietnam">Management</h1>
                        <span className="text-[#E0E0E0]">사용자의 가입 요청을 승인하거나 거절하고, 기존 사용자를 관리할 수 있는 관리자 전용 페이지입니다.</span>
                    </div>
                </div>
                <div className="flex justify-center">
                    <UserManagementClient />
                </div>
            </div>
        </div>
    )
}
