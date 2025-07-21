"use client";
//http://localhost:3000/upload 로 접속!
import { useEffect, useState } from "react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

interface FileItem {
  fileId: number;
  fileName: string;
  memberId: string;
  fileSize: number;
  createdAt: string;
  locationId: number;
}

export default function FileListPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      console.log("현재 토큰:", token);
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/filelist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`서버 응답 오류 (${res.status}): ${errorText}`);
        }

        const data = await res.json();
        setFiles(data); // 
      } catch (err) {
        console.error("파일 목록 불러오기 실패:", err);
      } finally {
        setIsLoading(false); // 데이터 요청 완료 후 로딩 상태 해제
      }
    };

    fetchFiles();
  }, []);


  const filteredFiles = files.filter((file) =>
    file.fileName.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredFiles.length / rowsPerPage);
  const displayedFiles = filteredFiles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">데이터를 불러오는 중입니다...</td>
                  </tr>
                ) : displayedFiles.length > 0 ? (
                  displayedFiles.map((file) => (
                    <tr key={file.fileId} className="hover:bg-[rgba(55,55,55)] transition-colors">
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{file.fileName}</td>
                      <td className="px-6 py-4">{file.memberId}</td>
                      <td className="px-6 py-4">{(file.fileSize / 1024).toFixed(1)} KB</td>
                      <td className="px-6 py-4">{new Date(file.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center space-x-4">
                        <Link
                          href={`/fileview/${file.fileName}`}
                          className="font-medium text-blue-400 hover:underline"
                        >
                          미리보기
                        </Link>
                        <a
                          href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/download/${file.fileId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-green-400 hover:underline"
                        >
                          다운로드
                        </a>
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
