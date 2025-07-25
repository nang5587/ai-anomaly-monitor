'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import Papa from 'papaparse';
import TruckAnimation from '@/components/TruckAnimation';
import PreviewTable from '../../components/upload/PreviewTable';

import { statusBarAtom, resetStatusBarAtom } from '@/stores/uiAtoms';

import { useAuth } from '@/context/AuthContext';
import { X, Filter, Search, Sheet, UploadCloud, AlertTriangle } from 'lucide-react';
import jwtDecode from "jwt-decode";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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

  const [fileName, setFileName] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  
  const stompClientRef = useRef<Client | null>(null);
  
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle');
  const [isStatusBarVisible, setIsStatusBarVisible] = useState(false);

  const connectWebSocket = () => {
    const currentToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (!user || !currentToken) {
      console.error("WebSocket: 사용자 정보 없음");
      return;
    }
    if (stompClientRef.current && stompClientRef.current.active) {
      return; // 이미 연결됨
    }
    const wsUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/webSocket?token=${currentToken}`;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP]', str),
    });

    client.onConnect = () => {
      console.log(`WebSocket 연결 성공! /notify/${user.userId} 구독 시작`);
      client.subscribe(`/notify/${user.userId}`, (message) => {
        const messageText = message.body;
        console.log("📬 WebSocket 메시지 수신:", messageText);

        // ✨ 1. 수신한 메시지를 항상 uploadMessage 상태에 저장합니다.
        setUploadMessage(messageText);

        // ✨ 2. 특정 키워드를 감지하여 'uploadStatus'를 변경합니다.
        if (messageText.includes("완료되었습니다")) {
          console.log("✅ 성공 메시지 감지!");
          setUploadStatus('success');
          setProgress(1); // 성공 시 프로그레스 바를 100%로
        } else if (messageText.includes("오류 발생")) {
          console.error("❌ 오류 메시지 감지!");
          setUploadStatus('error');
          setErrors(prev => [...prev, messageText]); // 에러 목록에 추가
        } else {
          // 그 외의 모든 메시지는 '진행 중' 상태로 간주하고, 프로그레스를 조금씩 올립니다.
          // (백엔드에서 progress 값을 주지 않으므로, 메시지를 받을 때마다 조금씩 채우는 방식)
          setProgress(prev => Math.min(prev + 0.15, 0.95)); // 15%씩, 최대 95%까지만
        }
      });
    };
    client.onStompError = (frame) => {
      const errorMessage = `WebSocket 연결 오류: ${frame.headers['message']}`;
      setUploadStatus('error');
      setUploadMessage(errorMessage);
      setErrors(prev => [...prev, errorMessage]);
    };
    client.activate();
    stompClientRef.current = client;
  };

  useEffect(() => {
    // 컴포넌트 언마운트 시 WebSocket 연결 해제
    return () => {
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate();
      }
    };
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
            return 1;
          }
          return next;
        });
      }, 40);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const filteredRows = useMemo(() => {
    return previewRows.filter((row) => {
      // 1. 제품 필터
      if (productColName && selectedProduct !== '전체') {
        if (row[productColName]?.toString() !== selectedProduct) return false;
      }

      // 2. 검색 필터
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
    setUploadStatus('idle');
    setUploadMessage('');
    setCurrentFile(null);
    setErrors([]);
    setIsStatusBarVisible(false);
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

    handleReset();
    setCurrentFile(file);
    setFileName(file.name);
    setIsLoading(true);
    setIsStatusBarVisible(true);
    setUploadStatus('idle');
    setUploadMessage('');
    setErrors([]);

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
      complete: (results) => handleParsedData(results.data as any[], file),
      error: (err) => {
        console.error('CSV 파싱 실패:', err.message);
        setErrors([`CSV 파싱 실패: ${err.message}`]);
        setIsLoading(false);
      },
    });
  };

  async function handleParsedData(data: any[], fileToUpload: File) {
    if (data.length === 0) {
      setErrors(["CSV 파일에 데이터가 없습니다."]);
      setIsLoading(false);
      setIsStatusBarVisible(false);
      return;
    }

    try {
      setPreviewCols(Object.keys(data[0] || {}));
      setPreviewRows(data);

      const foundProductCol = Object.keys(data[0] || {}).find(col =>
        col.includes('제품') || col.includes('product') || col.toLowerCase().includes('product')
      );

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

      setIsUploaded(true);

      uploadToBackend(fileToUpload);

    } catch (error) {
      console.error('데이터 처리 중 오류:', error);
      setErrors(['데이터 처리 중 오류가 발생했습니다.']);
      setIsLoading(false);
      setIsStatusBarVisible(false);
    }
  }

  const uploadToBackend = async (file: File) => {
    const currentToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!user?.role || !currentToken) {
      setErrors(['사용자 정보가 없습니다. 다시 로그인해주세요.']);
      setUploadStatus('error');
      setIsLoading(false);
      return;
    }

    try {
      connectWebSocket();

      setUploadStatus('uploading');
      setUploadMessage('서버로 파일 전송 중...');
      setProgress(0.05);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manager/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
        body: formData,
      });

      const resultText = await response.text();

      if (!response.ok) {
        throw new Error(resultText || `파일 전송 실패 (${response.status})`);
      }

      console.log('📤 파일 전송 성공, 서버 처리 시작:', resultText);
      setUploadMessage(resultText);
      setProgress(0.1);
    } catch (error: any) {
      console.error('업로드 요청 오류:', error);
      setUploadStatus('error');
      const errorMessage = error.message;
      setUploadMessage(errorMessage);
      setErrors(prev => [...prev, errorMessage]);
    }
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

  const retryUpload = () => {
    if (currentFile) {
      setIsLoading(true);
      setUploadStatus('idle');
      setErrors([]);
      uploadToBackend(currentFile);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[rgba(40,40,40)]">
      {isStatusBarVisible && (
        <div className={`sticky top-0 w-full z-20 flex-shrink-0 p-3 transition-all duration-300 ${uploadStatus === 'error' ? 'bg-red-100 border-b border-red-300' :
          uploadStatus === 'success' ? 'bg-green-100 border-b border-green-300' :
            'bg-blue-100 border-b border-blue-300'
          }`}>
          <div className="flex items-center justify-between mb-2 max-w-7xl mx-auto">
            <div className={`font-semibold flex items-center gap-2 ${uploadStatus === 'error' ? 'text-red-800' :
              uploadStatus === 'success' ? 'text-green-800' :
                'text-blue-800'
              }`}>
              {/* 상태에 따른 아이콘 */}
              {uploadStatus === 'uploading' && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
              {uploadStatus === 'success' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
              {uploadStatus === 'error' && <AlertTriangle size={16} />}

              {/* 상태에 따른 메시지 제목 */}
              <span>
                {uploadStatus === 'parsing' && '파일 분석 중...'}
                {uploadStatus === 'uploading' && '파일 업로드 중...'}
                {uploadStatus === 'success' && '업로드 성공'}
                {uploadStatus === 'error' && '업로드 실패'}
              </span>
            </div>

            {/* 성공 또는 실패 시에만 X 버튼 표시 */}
            {(uploadStatus === 'success' || uploadStatus === 'error') && (
              <button
                onClick={() => setIsStatusBarVisible(false)}
                className="p-1 rounded-full text-gray-600 hover:bg-black/10 hover:text-black transition-colors"
                aria-label="상태 바 닫기"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-gray-300 rounded-full h-2.5 max-w-7xl mx-auto">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${uploadStatus === 'error' ? 'bg-red-500' :
                uploadStatus === 'success' ? 'bg-green-500' :
                  'bg-blue-500'
                }`}
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>

          {/* 상세 메시지 */}
          <p className="text-sm text-gray-700 mt-2 text-center max-w-7xl mx-auto truncate">
            {uploadMessage}
          </p>
        </div>
      )}

      <div className="w-full h-full">
        {isUploaded ? (
          <PreviewTable
            fileName={fileName}
            factoryName={factoryName}
            previewRows={previewRows}
            previewCols={previewCols}
            productList={productList}
            productColName={productColName}
            onClose={() => setIsUploaded(false)}
          />
        ) : (
          <div className="w-full h-full bg-[rgba(40,40,40)] p-10">
            <div className="flex items-center mb-20 gap-4">
              <div className="flex flex-col justify-center gap-1">
                <h1 className="text-white text-4xl font-vietnam">CSV Upload</h1>
                <span className="text-[#E0E0E0]">바코드 로그 파일을 업로드해주세요.</span>
              </div>
            </div>
            {errors.length > 0 && uploadStatus === 'error' && (
              <div className="mb-6 mx-auto max-w-3xl p-4 bg-red-100 border border-red-400 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertTriangle size={20} />
                  <span className="font-semibold">오류가 발생했습니다</span>
                </div>
                {errors.map((error, index) => (
                  <div key={index} className="text-red-600 text-sm break-words">{error}</div>
                ))}
                {currentFile && (
                  <button
                    onClick={retryUpload}
                    className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            )}


            <div className="flex justify-center">
              {isLoading ? (
                // --- 로딩 중일 때 (진행/성공) ---
                <div className="w-full max-w-3xl text-center">

                  {/* 진행 중 UI */}
                  {(uploadStatus === 'parsing' || uploadStatus === 'uploading') && (
                    <div>
                      <TruckAnimation progress={progress} />
                      <p className="mt-4 text-lg font-semibold text-white animate-pulse">
                        {uploadMessage || '파일을 처리하고 있습니다...'}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-blue-300">
                        {Math.round(progress * 100)}%
                      </p>
                    </div>
                  )}

                  {/* 업로드 성공했을 때 */}
                  {uploadStatus === 'success' && (
                    <div className="p-8 bg-[rgba(50,50,50)] rounded-lg shadow-lg">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L-19 7" /></svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">업로드 완료</h2>
                      <p className="text-gray-300 mb-6">{uploadMessage}</p>
                      <div className="flex justify-center gap-4">
                        <button onClick={() => { alert('대시보드로 이동합니다.'); }} className="px-6 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600">대시보드로 이동</button>
                        <button onClick={() => setIsUploaded(true)} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">업로드 파일 미리보기</button>
                        <button onClick={handleReset} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">새 파일 업로드</button>
                      </div>
                    </div>
                  )}
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
                    <UploadCloud
                      size={64}
                      className={`mx-auto mb-4 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-400'}`}
                    />
                    <h2 className="text-xl font-noto-500 text-white">여기에 파일을 드래그 앤 드롭하세요</h2>
                    <p className="font-noto-400 text-gray-400 my-2">또는</p>
                    <input
                      type="file"
                      id="file-upload"
                      accept=".csv"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="font-noto-400 inline-block px-4 py-2 text-white transition bg-[rgba(111,131,175)] rounded-lg cursor-pointer hover:bg-gray-500"
                    >
                      파일 선택
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}