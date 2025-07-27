'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import Papa from 'papaparse';
import PreviewTable from '../../components/upload/PreviewTable';

import { statusBarAtom, resetStatusBarAtom } from '@/stores/uiAtoms';

import { useAuth } from '@/context/AuthContext';
import { UploadCloud } from 'lucide-react';
import jwtDecode from "jwt-decode";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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

  const stompClientRef = useRef<Client | null>(null);

  const setStatusBar = useSetAtom(statusBarAtom);
  const resetStatusBar = useSetAtom(resetStatusBarAtom);

  const statusBar = useAtomValue(statusBarAtom);

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

        // 기본적으로 메시지는 항상 업데이트
        setStatusBar(prev => ({ ...prev, message: messageText, status: 'uploading' }));

        // 성공 메시지 처리
        if (messageText.includes("완료되었습니다")) {
          setStatusBar(prev => ({ ...prev, status: 'success', progress: 1, message: messageText }));
          return; // 처리가 끝났으므로 함수 종료
        }

        // 다양한 오류 메시지 처리
        if (messageText.includes("오류 발생") || messageText.includes("실패") || messageText.includes("중단되었습니다")) {
          setStatusBar(prev => ({ ...prev, status: 'error', progress: 1, message: messageText }));
          return;
        }

        // 진행 단계별로 progress 세분화
        let progress = 0;
        if (messageText.includes("파일 업로드 시작")) {
          progress = 0.1;
        } else if (messageText.includes("CSV 저장 완료")) {
          progress = 0.2;
        } else if (messageText.includes("AI 분석 데이터 준비 중")) {
          progress = 0.3;
        } else if (messageText.includes("AI 분석 중")) {
          progress = 0.4;
        } else if (messageText.includes("이동 경로 분석 생성 중")) {
          progress = 0.6;
        } else if (messageText.includes("이상 종류 판별 생성 중")) {
          progress = 0.7;
        } else if (messageText.includes("KPI 분석 생성 중")) {
          progress = 0.8;
        } else if (messageText.includes("통계 데이터 생성 중")) {
          progress = 0.9;
        } else {
          setStatusBar(prev => ({ ...prev, message: messageText }));
          return;
        }

        setStatusBar(prev => ({ ...prev, progress: Math.max(prev.progress, progress) }));
      });
    };
    client.onStompError = (frame) => {
      const errorMessage = `WebSocket 연결 오류: ${frame.headers['message']}`;
      setStatusBar({
        visible: true,
        status: 'error',
        message: errorMessage,
        progress: 1,
      });
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

  const handleReset = () => {
    setFileName('');
    setFactoryName('');
    setPreviewRows([]);
    setPreviewCols([]);
    setIsLoading(false);
    setIsUploaded(false);
    setCurrentPage(1);
    setProductList([]);
    setSelectedProduct('전체');
    setFilters({});
    setEnableFilter(false);
    setSearchColumn('');
    setSearchKeyword('');
    setProductColName(null);
    setCurrentFile(null);
    setErrors([]);
    resetStatusBar();
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

    setStatusBar({
      visible: true,
      status: 'parsing',
      message: '파일 분석 중...',
      progress: 0,
    });

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
        setStatusBar({
          visible: true,
          status: 'error',
          message: `CSV 파싱 실패: ${err.message}`,
          progress: 1,
        });
        setIsLoading(false);
      },
    });
  };

  async function handleParsedData(data: any[], fileToUpload: File) {
    if (data.length === 0) {
      setStatusBar({
        visible: true,
        status: 'error',
        message: "CSV 파일에 데이터가 없습니다.",
        progress: 1,
      });
      setErrors(["CSV 파일에 데이터가 없습니다."]);
      setIsLoading(false);
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
      setStatusBar({
        visible: true,
        status: 'error',
        message: '데이터 처리 중 오류가 발생했습니다.',
        progress: 1,
      });
    }
  }

  const uploadToBackend = async (file: File) => {
    const currentToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!user || !currentToken) {
      setStatusBar({
        visible: true,
        status: 'error',
        message: '사용자 정보 또는 토큰이 없습니다. 다시 로그인해주세요.',
        progress: 1,
      });
      return;
    }

    try {
      connectWebSocket();

      setStatusBar(prev => ({
        ...prev,
        status: 'uploading',
        message: '서버로 파일 전송 중...',
        progress: 0.05
      }));

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
      setStatusBar(prev => ({
        ...prev,
        message: resultText,
        progress: 0.1, // 10%로 설정
      }));
    } catch (error: any) {
      setStatusBar({
        visible: true,
        status: 'error',
        message: error.message || '업로드 요청 중 오류가 발생했습니다.',
        progress: 1, // 실패 시 바를 꽉 채울 수도 있습니다.
      });
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

  const retryUpload = () => {
    if (currentFile) {
      setIsLoading(true);
      setStatusBar({
        visible: true,
        status: 'uploading',
        message: '업로드를 다시 시도합니다...',
        progress: 0,
      });
      setErrors([]);
      uploadToBackend(currentFile);
    }
  };

  return (
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

          <div className="flex justify-center">
            {!isLoading ? (
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
            ) : (
              <div className="w-full max-w-3xl text-center">
                {/* 진행 중 UI */}
                {(statusBar.status === 'parsing' || statusBar.status === 'uploading') && (
                  <div>
                    <button onClick={() => setIsUploaded(true)} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">업로드 파일 미리보기</button>
                  </div>
                )}

                {/* 업로드 성공했을 때 */}
                {statusBar.status === 'success' && (
                  <div className="p-8 bg-[rgba(50,50,50)] rounded-lg shadow-lg">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L-19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">업로드 완료</h2>
                    <p className="text-gray-300 mb-6">{statusBar.message}</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => { alert('대시보드로 이동합니다.'); }} className="px-6 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600">대시보드로 이동</button>
                      <button onClick={() => setIsUploaded(true)} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">업로드 파일 미리보기</button>
                      <button onClick={handleReset} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">새 파일 업로드</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}