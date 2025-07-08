import UserManagementClient from "@/components/user-management/UserManagementClient"

export default function page() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-white text-3xl font-bold mb-6">사용자 관리</h1>
            <UserManagementClient />
        </div>
    )
}
