"use client";

import { useState, useEffect } from "react";
import { useSetAtom } from "jotai";

import apiClient, { getFiles_client } from '../../api/apiClient';

import { selectedFileIdAtom } from "@/stores/mapDataAtoms"; // Jotai 아톰 경로
import { useRouter } from "next/navigation";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// FileItem 타입을 props로 받기 위해 export 해주는 것이 좋습니다. (data.ts 등에서)
interface FileItem {
    fileId: number;
    fileName: string;
    memberId: string;
    fileSize: number;
    createdAt: string;
    locationId: number;
}

interface FileListClientProps {
    initialFiles: FileItem[];
}

export default function FileListClient({ initialFiles }: FileListClientProps) {
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
        // Jotai 아톰에 선택된 fileId를 설정합니다.
        setFileId(fileId);
        // 대시보드 페이지로 이동합니다.
        router.push('/dashboard'); // 실제 대시보드 경로로 변경
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

    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            return;
        }

        // 서버에서 데이터를 못 가져온 경우 (HttpOnly 쿠키가 없었을 경우),
        // 클라이언트에서 localStorage 토큰을 사용하여 다시 시도합니다.
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
                                    <th scope="col" className="px-6 py-3 text-center">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {displayedFiles.length > 0 ? (
                                    displayedFiles.map((file) => (
                                        <tr key={file.fileId} className="hover:bg-[rgba(55,55,55)] transition-colors">
                                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{file.fileName}</td>
                                            <td className="px-6 py-4">{file.memberId}</td>
                                            <td className="px-6 py-4">{(file.fileSize / 1024).toFixed(1)} KB</td>
                                            <td className="px-6 py-4">{new Date(file.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center space-x-4">
                                                <button
                                                    onClick={() => handleFileSelect(file.fileId)}
                                                    className="font-medium text-blue-400 hover:underline"
                                                >
                                                    미리보기
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(file.fileId, file.fileName)}
                                                    className="font-medium text-green-400 hover:underline"
                                                >
                                                    다운로드
                                                </button>
                                                <button
                                                    className="font-medium text-red-400 hover:underline"
                                                    onClick={() => alert("삭제 기능은 아직 구현되지 않았습니다.")}
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10">
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
