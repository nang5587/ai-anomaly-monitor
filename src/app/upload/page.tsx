'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import TruckAnimation from '@/components/TruckAnimation';
import { useAuth } from '@/context/AuthContext';
import { X, Filter, Search, Sheet, UploadCloud } from 'lucide-react';
import jwtDecode from "jwt-decode";

const getColumnName = (index: number) => {
  let name = '';
  let i = index;
  while (i >= 0) {
    name = String.fromCharCode(65 + (i % 26)) + name;
    i = Math.floor(i / 26) - 1;
  }
  return name;
};

export default function BarcodeLogUploadPage() {
  const { user } = useAuth();
  // const user = {
  //   userId: "user1",
  //   role: "ADMIN",
  //   locationId: 0
  // }

  const [fileName, setFileName] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [productList, setProductList] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('전체');
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [enableFilter, setEnableFilter] = useState(false);
  const [searchColumn, setSearchColumn] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const rowsPerPage = 100;

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
  const [formulaBarContent, setFormulaBarContent] = useState('');

  const [token, setToken] = useState<string | null>(null);
  const [productColName, setProductColName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // 파일 입력(input) 엘리먼트의 참조를 저장하기 위함
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Hook 먼저 실행, 조건 분기는 그 후에 처리
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      setToken(t);
    }
  }, []);

  useEffect(() => {
    setSearchKeyword('');
  }, [searchColumn]);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 0.02;
          if (next >= 1) {
            clearInterval(interval);
            setProgress(1);
            setIsUploaded(true);
            setIsLoading(false);
          }
          return next >= 1 ? 1 : next;
        });
      }, 40);
    }
  }, [isLoading]);

  const filteredRows = useMemo(() => {
    return previewRows.filter((row) => {
      // 1. 제품 필터
      if (productColName && selectedProduct !== '전체') {
        if (row[productColName]?.toString() !== selectedProduct) return false;
      }

      // ✅ 2. 검색 필터 (단순화된 로직)
      if (searchColumn && searchKeyword) {
        const cellValue = row[searchColumn]?.toString().toLowerCase() || '';
        if (!cellValue.includes(searchKeyword.toLowerCase())) return false;
      }

      // 3. 개별 드롭다운 필터
      const filterEntries = Object.entries(filters);
      if (filterEntries.length > 0) {
        if (!filterEntries.every(([col, val]) => !val || row[col]?.toString() === val)) {
          return false;
        }
      }

      return true;
    });
  }, [previewRows, productColName, selectedProduct, searchColumn, searchKeyword, filters]);

  const uniqueFilterValues = useMemo(() => {
    if (!enableFilter) return {};
    const values: { [key: string]: Set<any> } = {};
    previewCols.forEach(col => {
      values[col] = new Set(previewRows.map(row => row[col] ?? ''));
    });
    return values;
  }, [enableFilter, previewRows, previewCols]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const displayedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleReset = () => {
    setFileName('');
    setFactoryName('');
    setPreviewRows([]);
    setPreviewCols([]);
    setIsLoading(false);
    setIsUploaded(false);
    setProgress(0);
    setCurrentPage(1);
    setProductList([]);
    setSelectedProduct('전체');
    setFilters({});
    setEnableFilter(false);
    setSearchColumn('');
    setSearchKeyword('');
    setProductColName(null);
    // 파일 입력 값을 초기화하여 같은 파일을 다시 업로드할 수 있게 함
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') {
      alert('CSV 파일만 업로드할 수 있습니다.');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    // 상태 초기화
    setPreviewRows([]);
    setPreviewCols([]);
    setCurrentPage(1);
    setSelectedProduct('전체');
    setFilters({});
    setEnableFilter(false);
    setProductColName(null);
    setSelectedCell(null);
    setFormulaBarContent('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => handleParsedData(results.data as any[]),
      error: (err) => {
        console.error('CSV 파싱 실패:', err.message);
        setIsLoading(false);
      },
    });
  };



  // const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   setFileName(file.name);
  //   setPreviewRows([]);
  //   setPreviewCols([]);
  //   setErrors([]);
  //   setIsLoading(true);
  //   setCurrentPage(1);
  //   setSelectedProduct('전체');
  //   setFilters({});
  //   setEnableFilter(false);
  //   setProductColName(null);
  //   setSelectedCell(null); // ✨ 셀 선택 상태 초기화
  //   setFormulaBarContent('');

  //   const ext = file.name.split('.').pop()?.toLowerCase();
  //   if (ext !== 'csv') {
  //     console.error('CSV 파일만 업로드 가능합니다.');
  //     setIsLoading(false);
  //     return;
  //   }

  //   Papa.parse(file, {
  //     header: true,
  //     skipEmptyLines: true,
  //     complete: async (results) => {
  //       const data = results.data as any[];
  //       await handleParsedData(data, file);
  //     },
  //     error: (err) => {
  //       console.error('CSV 파싱 실패:', err.message);
  //       setIsLoading(false);
  //     },
  //   });

  async function handleParsedData(data: any[]) {
    if (data.length === 0) {
      console.error("CSV 파일에 데이터가 없습니다.");
      setIsLoading(false);
      return;
    }

    setPreviewCols(Object.keys(data[0] || {}));
    setPreviewRows(data);

    const foundProductCol = Object.keys(data[0] || {}).find(col => col.includes('제품') || col.includes('product'));

    if (foundProductCol) {
      setProductColName(foundProductCol);
      const productSet = new Set(data.map(row => row[foundProductCol] ?? '미지정'));
      setProductList(['전체', ...Array.from(productSet) as string[]]);
    } else {
      setProductList(['전체']);
    }

    const firstCol = Object.keys(data[0] || {})[0];
    const rawFactoryValue = data[0][firstCol] || '';
    const matchedFactory =
      rawFactoryValue.toString().split(/공장/)[0] +
      (rawFactoryValue.includes('공장') ? '공장' : '');
    setFactoryName(matchedFactory || '공장 정보 없음');

    // if (!user?.role) {
    //   console.error('사용자 역할 정보 없음');
    //   setIsLoading(false);
    //   return;
    // }

    // try {
    //   const formData = new FormData();
    //   formData.append('file', fileToUpload);

    //   console.log("📤 업로드 요청 시작: ", {
    //     url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manager/upload`,
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   });

    //   const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manager/upload`, {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //     body: formData,
    //   });

    //   const result = await response.text();
    //   if (!response.ok || !result.includes('성공')) {
    //     console.error('업로드 실패 응답:', result);
    //     return;
    //   }

    //   console.log(' 백엔드 업로드 성공:', result);
    //   setIsUploaded(true);
    // } catch (err: any) {
    //   console.error('업로드 중 오류 발생:', err.message || err);
    // } finally {
    //   setIsLoading(false);
    // }
    console.log("💡 백엔드 API 호출을 건너뛰고 프론트엔드 테스트 모드로 진행합니다.");

  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleFilterChange = (col: string, value: string) => {
    setFilters((prev) => ({ ...prev, [col]: value }));
    setCurrentPage(1);
  };

  const handleCellClick = (rowIndex: number, colName: string, content: any) => {
    setSelectedCell({ row: rowIndex, col: colName });
    setFormulaBarContent(content?.toString() ?? '');
  };

  //  렌더링 자체는 token 준비 완료 후에만
  if (!token) return <div className="p-6 text-center">토큰 확인 중...</div>;

  // ✨ isUploaded 상태에 따라 다른 최상위 div를 렌더링
  return (
    <>
      {isUploaded ? (
        <div className="fixed inset-0 z-50 flex flex-col w-full h-full bg-gray-100 text-sm">
          {/* 리본 메뉴 (툴바) */}
          <div className="flex-shrink-0 bg-gray-200 p-2 flex items-center gap-4 border-b border-gray-300">
            <Sheet size={20} className="text-green-700" />
            <div className="font-bold text-gray-800">{fileName}</div>
            <div className="w-px h-6 bg-gray-400"></div>
            <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }} className="px-2 py-1 border border-gray-400 rounded bg-white">
              <option value="전체">모든 제품</option>
              {productList.slice(1).map((product, idx) => (<option key={idx} value={product}>{product}</option>))}
            </select>
            <div className="flex items-center gap-1">
              <Search size={16} className="text-gray-600" />
              <select value={searchColumn} onChange={(e) => setSearchColumn(e.target.value)} className="px-2 py-1 border border-gray-400 rounded bg-white">
                <option value="">검색할 열...</option>
                {previewCols.map((col) => (<option key={col} value={col}>{col}</option>))}
              </select>
              <input
                type="text"
                placeholder={!searchColumn ? "열을 먼저 선택하세요" : "검색어..."}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                disabled={!searchColumn}
                className="w-48 px-2 py-1 border border-gray-400 rounded disabled:bg-gray-200 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setEnableFilter(!enableFilter)} className={`px-3 py-1 text-sm border border-gray-400 rounded flex items-center cursor-pointer gap-2 ${enableFilter ? 'bg-[rgba(111,131,175)] text-white' : 'bg-white'}`}>
                <Filter size={14} /> {enableFilter ? '필터 숨기기' : '필터 표시'}
              </button>
              <button onClick={handleReset} className="p-1.5 rounded-full hover:bg-gray-300 cursor-pointer" aria-label="닫기"><X size={20} /></button>
            </div>
          </div>

          {/* 수식 입력줄 */}
          <div className="flex-shrink-0 bg-white p-1 flex items-center border-b border-gray-300">
            <div className="px-2 py-0.5 text-gray-500 font-mono text-xs border-r border-gray-300 mr-2">fx</div>
            <input type="text" readOnly value={formulaBarContent} className="w-full bg-transparent outline-none text-gray-800" />
          </div>

          {/* 메인 그리드 영역 */}
          <div className="flex-1 overflow-auto">
            <table className="min-w-full border-collapse">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 bg-gray-200 border-r border-gray-300 w-12 shadow-[inset_0_-1px_0_#d1d5db]"> </th>
                  {previewCols.map((col, colIndex) => (
                    <th key={col} className="bg-gray-200  border-r border-gray-300 p-1 font-mono text-xs text-gray-600 shadow-[inset_0_-1px_0_#d1d5db]">
                      {getColumnName(colIndex)}
                    </th>
                  ))}
                </tr>

                {/* 행 2: 원본 CSV 데이터 헤더 */}
                <tr>
                  <th className="sticky left-0 z-20 w-12 font-semibold text-center text-gray-600 bg-gray-200 border-r border-gray-300 shadow-[inset_0_-1px_0_#d1d5db]">#</th>
                  {previewCols.map((col) => (
                    <th key={col} className="p-2 font-semibold text-left bg-gray-200 border-r border-gray-300 whitespace-nowrap shadow-[inset_0_-1px_0_#d1d5db]">
                      {col}
                    </th>
                  ))}
                </tr>
                {enableFilter && (
                  <tr>
                    <th className="sticky left-0 z-20 bg-gray-200 border-b border-r border-gray-300"> </th>
                    {previewCols.map((col) => {
                      return (
                        <th key={col} className="p-1 border-r border-b bg-gray-50">
                          <select value={filters[col] || ''} onChange={(e) => handleFilterChange(col, e.target.value)} className="w-full text-xs border rounded">
                            <option value="">전체</option>
                            {/* 미리 계산된 uniqueFilterValues를 사용 */}
                            {Array.from(uniqueFilterValues[col] || []).map((val: any, i) => (<option key={i} value={val}>{val}</option>))}
                          </select>
                        </th>
                      );
                    })}
                  </tr>
                )}
              </thead>
              <tbody>
                {displayedRows.map((row, rowIndex) => {
                  const absoluteRowIndex = (currentPage - 1) * rowsPerPage + rowIndex + 1;
                  return (
                    <tr key={rowIndex} className="bg-white">
                      <td className="sticky left-0 bg-gray-200 border-b border-r border-gray-300 text-center font-mono text-xs text-gray-600">{absoluteRowIndex}</td>
                      {previewCols.map((col, colIndex) => {
                        const isSelected = selectedCell?.row === absoluteRowIndex && selectedCell?.col === getColumnName(colIndex);
                        return (
                          <td
                            key={col}
                            onClick={() => handleCellClick(absoluteRowIndex, getColumnName(colIndex), row[col])}
                            className={`whitespace-nowrap p-1.5 border-b border-r border-gray-300 cursor-pointer transition-colors ${isSelected ? 'outline-2 outline-green-600 outline-offset-[-2px] bg-green-50' : 'hover:bg-gray-50'}`}
                          >
                            {row[col] ?? ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 상태 표시줄 (하단) */}
          <div className="flex-shrink-0 bg-[rgba(40,40,40)] text-white p-2 text-xs flex items-center justify-end gap-4">
            <div>{factoryName}</div>
            <div className="w-px h-4 bg-gray-500"></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="px-2 rounded hover:bg-[rgba(60,60,60)] disabled:opacity-50" disabled={currentPage === 1}>이전</button>
              <span>{currentPage} / {totalPages} 페이지</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="px-2 rounded hover:bg-[rgba(60,60,60)] disabled:opacity-50" disabled={currentPage === totalPages}>다음</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full">

          <div className="w-full h-full bg-[rgba(40,40,40)] p-10">
            <div className="flex items-center mb-20 gap-4">
              <div className="flex flex-col justify-center gap-1">
                <h1 className="text-white text-4xl font-vietnam">CSV Upload</h1>
                <span className="text-[#E0E0E0]">바코드 로그 파일을 업로드해주세요.</span>
              </div>
            </div>

            <div className="flex justify-center">
              {isLoading ? (
                <div className="flex items-center justify-center w-full h-full">
                  <TruckAnimation progress={progress} />
                </div>
              ) : (
                <div
                  className={`w-full max-w-3xl flex-1 flex flex-col justify-center items-center border-2 border-dashed rounded-lg transition-colors
                            ${isDragging ? 'border-blue-400 bg-gray-700' : 'border-[#E0E0E0]'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center p-10">
                    <UploadCloud size={64} className={`mx-auto mb-4 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                    <h2 className="text-xl font-noto-500 text-white">여기에 파일을 드래그 앤 드롭하세요</h2>
                    <p className="font-noto-400 text-gray-400 my-2">또는</p>
                    <input type="file" id="file-upload" accept=".csv" onChange={handleFileSelect} ref={fileInputRef} className="hidden" />
                    <label htmlFor="file-upload" className="font-noto-400 inline-block px-4 py-2 text-white transition bg-[rgba(111,131,175)] rounded-lg cursor-pointer hover:bg-gray-500">
                      파일 선택
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </>
  );
}