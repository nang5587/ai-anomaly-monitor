// 상세 보기 + 필터 + 다운로드
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import TruckAnimation from "@/components/TruckAnimation";
import { useAuth } from "@/context/AuthContext";

export default function FileViewPage() {
  const router = useRouter();
  const { fileName } = router.query;
  const { user } = useAuth();

  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [fileInfo, setFileInfo] = useState({ name: "", factoryName: "", fileLogId: "" });
  const [errors, setErrors] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;
  const [productList, setProductList] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("전체");
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [enableFilter, setEnableFilter] = useState(false);
  const [searchColumn, setSearchColumn] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  useEffect(() => {
    if (!fileName || typeof fileName !== "string" || !user?.role) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manager/file/${fileName}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("파일 데이터를 불러오지 못했습니다.");
        const data = await res.json();

        setPreviewRows(data.rows); // rows: [{...}]
        setPreviewCols(Object.keys(data.rows[0] || {}));
        const productCol = Object.keys(data.rows[0] || {}).find((col) => col.includes("제품") || col.includes("product"));
        const productSet = new Set(data.rows.map((row: any) => row[productCol] ?? "미지정"));
        setProductList(["전체", ...Array.from(productSet).map(String)]);

        const firstCol = Object.keys(data.rows[0] || {})[0];
        const rawFactoryValue = data.rows[0][firstCol] || "";
        const matchedFactory = rawFactoryValue.toString().split(/공장/)[0] + (rawFactoryValue.includes("공장") ? "공장" : "");

        setFileInfo({
          name: fileName,
          factoryName: matchedFactory,
          fileLogId: data.fileLogId ?? "", // 백엔드에서 같이 내려줄 것
        });
      } catch (err: any) {
        setErrors([err.message]);
      }
    };
    fetchData();
  }, [fileName, user]);

  const handleFilterChange = (col: string, value: string) => {
    setFilters((prev) => ({ ...prev, [col]: value }));
    setCurrentPage(1);
  };

  const filteredRows = previewRows.filter((row) => {
    if (selectedProduct !== "전체") {
      const values = Object.values(row);
      if (!values.includes(selectedProduct)) return false;
    }
    if (searchColumn && searchKeyword) {
      return row[searchColumn]?.toString().includes(searchKeyword);
    }
    return Object.entries(filters).every(([col, val]) => {
      if (!val) return true;
      return row[col] === val;
    });
  });

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const displayedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleDownload = () => {
    if (!fileInfo.fileLogId) return;
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/download/${fileInfo.fileLogId}`;
    window.open(url, "_blank");
  };

  const handleBack = () => router.push("/filelist");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">{fileInfo.factoryName} 로그 미리보기</h1>
    <p className="text-sm text-gray-500">({fileInfo.name})</p>
  </div>
  <div className="flex gap-2">
    <button onClick={handleBack} className="px-3 py-1 text-sm text-gray-700 border rounded">← 파일 목록</button>
    <button onClick={handleDownload} className="px-3 py-1 text-sm text-blue-700 border border-blue-500 rounded">⬇ 다운로드</button>
    <button onClick={() => setEnableFilter(true)} className="px-3 py-1 text-sm text-gray-700 border rounded">필터 걸기</button>
    <button onClick={() => { setEnableFilter(false); setFilters({}); }} className="px-3 py-1 text-sm text-gray-700 border rounded">필터 해제</button>
  </div>
        {errors.length > 0 && (
            <div className="w-full p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded">
            <h2 className="mb-2 font-semibold">오류 발생</h2>
            <ul>
                {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
                ))}
            </ul>
            </div>
        )}  

      <div className="px-6 mb-4">
        <label className="mr-2 text-gray-700">제품 선택:</label>
        <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }} className="px-2 py-1 border rounded">
          {productList.map((product, idx) => (
            <option key={idx} value={product}>{product}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 px-6 mb-4">
        <label className="text-gray-700">검색:</label>
        <select value={searchColumn} onChange={(e) => setSearchColumn(e.target.value)} className="px-2 py-1 border rounded">
          <option value="">컬럼 선택</option>
          {previewCols.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
        <input type="text" placeholder="검색어 입력" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-48 px-2 py-1 border rounded" />
      </div>

      <div className="flex-1 px-6 overflow-auto border">
        <table className="min-w-[1000px] w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100">
            {enableFilter && (
              <tr>
                {previewCols.map((col) => {
                  const uniqueValues = Array.from(new Set(filteredRows.map((row) => row[col] ?? "")));
                  return (
                    <th key={col} className="px-1 py-1 border whitespace-nowrap">
                      <select value={filters[col] || ""} onChange={(e) => handleFilterChange(col, e.target.value)} className="w-full text-xs border rounded">
                        <option value="">전체</option>
                        {uniqueValues.map((val, i) => (
                          <option key={i} value={val}>{val}</option>
                        ))}
                      </select>
                    </th>
                  );
                })}
              </tr>
            )}
            <tr>
              {previewCols.map((col) => (
                <th key={col} className="px-2 py-1 font-semibold bg-gray-100 border whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row, idx) => (
              <tr key={idx} className="border-t">
                {previewCols.map((col) => (
                  <td key={col} className="px-2 py-1 border whitespace-nowrap">{row[col] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-4 p-6">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} className="px-3 py-1 border rounded disabled:opacity-50" disabled={currentPage === 1}>이전</button>
        <span className="text-sm text-gray-700">{currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} className="px-3 py-1 border rounded disabled:opacity-50" disabled={currentPage === totalPages}>다음</button>
      </div>
    </div>
    
  );
}
