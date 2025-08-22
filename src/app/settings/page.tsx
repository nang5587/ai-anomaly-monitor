import UserSettings from "@/components/user-settings/UserSettings"
export default async function page() {
    return (
        <div className="w-full h-full overflow-y-auto bg-[rgba(40,40,40)]">
            <div className="w-full h-full p-10">
                <div className="flex items-center mb-10 gap-4">
                    <div className="flex flex-col justify-center gap-1">
                        <h1 className="text-white text-4xl font-vietnam">User</h1>
                        <span className="text-[#E0E0E0]">사용자 정보를 확인하고 수정할 수 있는 페이지입니다.</span>
                    </div>
                </div>
                <div className="flex justify-center">
                    <UserSettings />
                </div>
            </div>
        </div>
    )
}
