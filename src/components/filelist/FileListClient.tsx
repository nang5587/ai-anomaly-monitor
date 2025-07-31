"use client";

import { useState, useEffect } from "react";
import { useSetAtom } from "jotai";
import { useAuth } from '../../context/AuthContext';

import apiClient, { getFiles_client, markFileAsDeleted } from '../../api/apiClient';

import { selectedFileIdAtom } from "@/stores/mapDataAtoms"; // Jotai 아톰 경로
import { useRouter } from "next/navigation";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { FileItem } from "@/types/file";

import { LayoutDashboard, Download, Trash2 } from 'lucide-react';

interface FileListClientProps {
    initialFiles: FileItem[];
}

export default function FileListClient({ initialFiles }: FileListClientProps) {
    const { user } = useAuth();
    // 1. 상태 관리 로직
    const [files, setFiles] = useState<FileItem[]>(initialFiles);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // 2. Jotai 및 Next.js Router 설정
    const setFileId = useSetAtom(selectedFileIdAtom);
    const router = useRouter();

    // 3. 파일 선택 핸들러
    const handleFileSelect = (fileId: number) => {
        if (!user || !user.role) {
            alert("사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
            router.push('/login');
            return;
        }
        setFileId(fileId);
        let dashboardPath = '/';
        switch (user.role.toUpperCase()) {
            case 'ADMIN':
                dashboardPath = `/supervisor`;
                break;
            case 'MANAGER':
                dashboardPath = '/admin';
                break;
            default:
                alert("정의되지 않은 역할입니다. 관리자에게 문의하세요.");
                return;
        }

        // ✨ 템플릿 리터럴을 사용하여 URL에 쿼리 파라미터를 추가합니다.
        const finalUrl = `${dashboardPath}?fileId=${fileId}`;

        console.log('fileList에서 이동할 URL:', finalUrl);
        router.push(finalUrl);
    };

    // 4. 필터링 및 페이지네이션 로직 (기존과 동일)
    const filteredFiles = files.filter((file) =>
        file.fileName.toLowerCase().includes(search.toLowerCase())
    );
    const totalPages = Math.ceil(filteredFiles.length / rowsPerPage);
    const displayedFiles = filteredFiles.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleDownload = async (fileId: number, fileName: string) => {
        try {
            // apiClient를 사용하여 GET 요청을 보냅니다.
            // 인터셉터가 자동으로 Authorization 헤더에 토큰을 추가해줍니다.
            const response = await apiClient.get(`/manager/download/${fileId}`, {
                // ✨ 응답 타입을 'blob'으로 지정하여 파일 데이터를 받습니다.
                responseType: 'blob',
            });

            // Blob 데이터를 사용하여 다운로드 가능한 URL을 생성합니다.
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // 임시 <a> 태그를 만들어 프로그래밍 방식으로 클릭하여 다운로드를 실행합니다.
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); // 다운로드될 파일의 이름을 지정합니다.
            document.body.appendChild(link);
            link.click();

            // 다운로드 후 임시 URL과 <a> 태그를 정리합니다.
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("파일 다운로드 실패:", error);
            alert("파일을 다운로드하는 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (fileId: number, fileName: string) => {
        if (!window.confirm(`'${fileName}' 파일을 정말로 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await markFileAsDeleted(fileId);

            setFiles(prevFiles => prevFiles.filter(file => file.fileId !== fileId));

            alert(`'${fileName}' 파일이 성공적으로 삭제되었습니다.`);

        } catch (error) {
            console.error("파일 삭제 실패:", error);
            alert("파일을 삭제하는 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            return;
        }

        async function fetchFilesOnClient() {
            console.log("서버에서 데이터를 가져오지 못했습니다. 클라이언트에서 재시도합니다.");
            setIsLoading(true);
            try {
                const clientFiles = await getFiles_client();
                setFiles(clientFiles);
                console.log('files', files)
            } catch (error) {
                console.error("클라이언트에서도 파일 목록 가져오기 실패:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchFilesOnClient();
    }, [initialFiles]);

    if (isLoading) {
        return <div className="text-center text-white py-10">데이터를 불러오는 중입니다...</div>
    }

    return (
        <div className="w-full h-full">
            <div className="w-full h-full bg-[rgba(40,40,40)] p-10">
                <div className="flex items-center mb-20 gap-4">
                    <div className="flex flex-col justify-center gap-1">
                        <h1 className="text-white text-4xl font-vietnam">CSV History</h1>
                        <span className="text-[#E0E0E0]">업로드된 CSV 파일 이력입니다.</span>
                    </div>
                </div>

                {/* ✅ 1. 부모 div에서 flex-col을 추가하여 자식 요소들을 수직으로 정렬합니다. */}
                <div className="flex flex-col flex-1">
                    {/* 검색 및 컨트롤 영역 */}
                    <div className="flex justify-end mb-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1); // 검색어 변경 시 첫 페이지로 이동
                                }}
                                placeholder="파일명으로 검색..."
                                className="w-72 pl-10 pr-4 py-2 text-sm text-white bg-[rgba(40,40,40)] border border-[rgba(111,131,175)] rounded-lg focus:outline-none"
                            />
                            <SearchIcon className="absolute left-3 top-1/4 w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    {/* 테이블 영역 */}
                    <div className="flex-1 overflow-auto rounded-2xl bg-[rgba(30,30,30)] p-4">
                        <table className="min-w-full text-sm text-left text-gray-300">
                            <thead className="text-sm font-medium text-white uppercase sticky top-0 border-b-2 border-b-[rgba(111,131,175)]">
                                <tr>
                                    <th scope="col" className="px-6 py-3">파일명</th>
                                    <th scope="col" className="px-6 py-3">업로더</th>
                                    <th scope="col" className="px-6 py-3">크기</th>
                                    <th scope="col" className="px-6 py-3">업로드 시간</th>
                                    <th scope="col" className="px-6 py-3 text-center">대시보드</th>
                                    <th scope="col" className="px-6 py-3 text-center">다운로드</th>
                                    <th scope="col" className="px-6 py-3 text-center">삭제</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {displayedFiles.length > 0 ? (
                                    displayedFiles.map((file) => (
                                        <tr key={file.fileId} className="">
                                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{file.fileName}</td>
                                            <td className="px-6 py-4">{file.userId}</td>
                                            <td className="px-6 py-4">{(file.fileSize / 1024).toFixed(1)} KB</td>
                                            <td className="px-6 py-4">{new Date(file.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center space-x-4">
                                                <button
                                                    onClick={() => handleFileSelect(file.fileId)}
                                                    className="font-medium text-blue-300 hover:bg-[rgba(55,55,55)] p-2 rounded-lg cursor-pointer"
                                                >
                                                    <LayoutDashboard className="h-4 w-4" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center space-x-4">
                                                <button
                                                    onClick={() => handleDownload(file.fileId, file.fileName)}
                                                    className="font-medium text-green-300 hover:bg-[rgba(55,55,55)] p-2 rounded-lg cursor-pointer"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center space-x-4">
                                                <button
                                                    className="font-medium text-red-300 hover:bg-[rgba(55,55,55)] p-2 rounded-lg cursor-pointer"
                                                    onClick={() => handleDelete(file.fileId, file.fileName)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-10">
                                            {search ? `"${search}"에 대한 검색 결과가 없습니다.` : "업로드된 파일이 없습니다."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 영역 */}
                    <div className="flex items-center justify-end pt-4">
                        <span className="text-sm text-gray-400 mr-4">
                            총 {filteredFiles.length}개 중 {displayedFiles.length}개 표시
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-white bg-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-white">
                                {currentPage} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 text-white bg-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
