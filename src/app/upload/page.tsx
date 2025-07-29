'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom, useAtomValue } from 'jotai';
import Papa from 'papaparse';
import PreviewTable from '../../components/upload/PreviewTable';

import { statusBarAtom, resetStatusBarAtom } from '@/stores/uiAtoms';
import { selectedFileIdAtom } from '@/stores/mapDataAtoms';

import { useAuth } from '@/context/AuthContext';
import { UploadCloud } from 'lucide-react';
import jwtDecode from "jwt-decode";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { fileResend_client } from '@/api/apiClient';

export default function BarcodeLogUploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [fileName, setFileName] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productList, setProductList] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('전체');
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [enableFilter, setEnableFilter] = useState(false);
  const [searchColumn, setSearchColumn] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isCsvSaveCompleted, setIsCsvSaveCompleted] = useState(false);
  const [isResendError, setIsResendError] = useState(false);
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
  const setSelectedFileId = useSetAtom(selectedFileIdAtom);

  const statusBar = useAtomValue(statusBarAtom);
  const fileIdForRedirect = useAtomValue(selectedFileIdAtom);

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

        // --- 1. 최종 상태 (성공 또는 실패)를 먼저 확인합니다. ---

        // 성공 메시지 처리
        if (messageText.includes("완료되었습니다") || messageText.includes("재전송 성공")) {
          setStatusBar({ visible: true, status: 'success', progress: 1, message: messageText });
          setIsResendError(false);
          return; // 여기서 처리 종료
        }

        // 재전송 가능 오류 메시지 처리
        if (messageText.includes("재전송 시간이 너무 오래 걸려") || messageText.includes("재전송 중 알 수 없는 오류")) {
          if (isCsvSaveCompleted) {
            setStatusBar({ visible: true, status: 'error', progress: 1, message: messageText });
            setIsResendError(true);
          } else {
            setStatusBar({ visible: true, status: 'error', progress: 1, message: "AI 모듈 처리 전 오류가 발생했습니다. 파일을 다시 업로드해주세요." });
            setIsResendError(false);
          }
          return; // 여기서 처리 종료
        }

        // 일반 오류 메시지 처리
        if (messageText.includes("오류 발생") || messageText.includes("실패") || messageText.includes("중단되었습니다")) {
          setStatusBar({ visible: true, status: 'error', progress: 1, message: messageText });
          setIsResendError(false);
          return; // 여기서 처리 종료
        }


        // --- 2. 위에서 걸러지지 않았다면, 진행 중인 상태로 간주합니다. ---

        // "CSV 저장 완료" 메시지를 받으면 isCsvSaveCompleted 상태를 업데이트
        if (messageText.includes("CSV 저장 완료")) {
          setIsCsvSaveCompleted(true);
        }

        // 진행 단계별로 progress 세분화
        let progress = 0;
        if (messageText.includes("파일 업로드 시작")) progress = 0.1;
        else if (messageText.includes("CSV 저장 완료")) progress = 0.2;
        else if (messageText.includes("AI 분석 데이터 준비 중")) progress = 0.3;
        else if (messageText.includes("AI 분석 중")) progress = 0.4;
        else if (messageText.includes("이동 경로 분석 생성 중")) progress = 0.6;
        else if (messageText.includes("이상 종류 판별 생성 중")) progress = 0.7;
        else if (messageText.includes("KPI 분석 생성 중")) progress = 0.8;
        else if (messageText.includes("통계 데이터 생성 중")) progress = 0.9;
        // 그 외 모르는 진행 메시지는 progress를 변경하지 않음

        // 최종적으로 진행 상태를 한 번만 업데이트합니다.
        setStatusBar(prev => ({
          ...prev,
          status: 'uploading', // 진행 중 상태
          message: messageText, // 최신 메시지로 업데이트
          progress: progress > 0 ? Math.max(prev.progress, progress) : prev.progress // progress가 0이면 이전 값 유지
        }));
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
    setIsPreviewVisible(false);
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
    setIsResendError(false);
    setIsCsvSaveCompleted(false);
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
      setIsPreviewVisible(true);

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

      let messageForStatus = resultText;
      try {
        // 1. fetch 응답을 JSON으로 파싱합니다.
        const parsedResult = JSON.parse(resultText);
        messageForStatus = parsedResult.message || resultText;

        // 2. "업로드 시작됨" 메시지에서 fileId를 추출합니다.
        if (messageForStatus.includes("업로드 시작됨. 파일 ID:")) {
          // 정규 표현식을 사용하여 "파일 ID: " 뒤의 숫자를 찾습니다.
          const match = messageForStatus.match(/파일 ID: (\d+)/);

          if (match && match[1]) {
            const fileId = parseInt(match[1], 10);
            console.log(`✅ 파일 ID (${fileId}) 추출 성공! Atom에 저장합니다.`);

            // 3. 추출한 fileId를 Jotai atom에 저장합니다.
            setSelectedFileId(fileId);
          }
        }
      } catch (e) {
        // JSON 파싱에 실패해도 오류로 처리하지 않고, 원본 텍스트를 메시지로 사용합니다.
        console.warn("파일 전송 응답이 JSON 형식이 아닙니다:", resultText);
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

  const handleResend = async () => {
    const fileId = fileIdForRedirect;
    if (!fileId) {
      alert("파일 ID를 찾을 수 없어 재시도할 수 없습니다.");
      return;
    }
    setIsResendError(false);
    setStatusBar({
      visible: true,
      status: 'uploading',
      message: 'AI 모듈로 재전송을 시도합니다...',
      progress: 0.3,
    });

    try {
      const result = await fileResend_client(fileId);
      console.log("재전송 요청 성공:", result);
    } catch (error: any) {
      setStatusBar({
        visible: true,
        status: 'error',
        message: error.message || '재전송 요청 중 오류가 발생했습니다.',
        progress: 1,
      });
      setIsResendError(true);
    }
  };

  const handleGoToDashboard = () => {
    if (!user) {
      alert("사용자 정보가 없습니다. 다시 로그인해주세요.");
      router.push('/login');
      return;
    }

    if (fileIdForRedirect) {
      const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';
      // ❗ STEP 4: fileId를 포함하여 대시보드 URL로 이동합니다.
      router.push(`/${role}?fileId=${fileIdForRedirect}`);
    } else {
      alert("분석이 완료된 파일 정보가 없습니다. 잠시 후 다시 시도해주세요.");
      // 또는 가장 최근 파일로 이동하는 로직을 추가할 수도 있습니다.
      const role = user.role.toUpperCase() === 'ADMIN' ? 'supervisor' : 'admin';
      router.push(`/${role}`);
    }
  };

  // BarcodeLogUploadPage.tsx의 return 문 내부를 이 코드로 교체하세요.

  return (
    <div className="w-full h-full">
      {/* 
          업로드 페이지의 기본 UI는 항상 렌더링됩니다.
          PreviewTable은 이 UI 위에 position: fixed로 띄워집니다.
        */}
      <div className="w-full h-full bg-[rgba(40,40,40)] p-10">
        <div className="flex items-center mb-20 gap-4">
          <div className="flex flex-col justify-center gap-1">
            <h1 className="text-white text-4xl font-vietnam">CSV Upload</h1>
            <span className="text-[#E0E0E0]">바코드 로그 파일을 업로드해주세요.</span>
          </div>
        </div>

        <div className="flex justify-center">
          {/* isLoading이 false일 때: 드래그 앤 드롭 영역 */}
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
            /* isLoading이 true일 때: 진행 상황 및 결과 UI */
            <div className="w-full max-w-3xl text-center">

              {/* 1. 미리보기 버튼 (항상 상단에 표시될 수 있음) */}
              <div className="mb-8">
                <button
                  onClick={() => setIsPreviewVisible(true)}
                  disabled={!isUploaded} // isUploaded(파싱완료)가 true일 때만 활성화
                  className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {isUploaded ? "업로드 파일 미리보기" : "파일 파싱 중 (미리보기 준비 중...)"}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  미리보기는 업로드 진행 상황과 별개로 작동합니다.
                </p>
              </div>

              {/* 2. 최종 결과 UI (성공/오류/재시도) */}

              {/* 재전송 오류 UI */}
              {statusBar.status === 'error' && isResendError && (
                <div className="p-8 bg-[rgba(50,50,50)] rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold text-white mb-2">재전송 오류</h2>
                  <p className="text-gray-300 mb-6">{statusBar.message}</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={handleResend} className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600">
                      다시 시도
                    </button>
                    <button onClick={handleReset} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
                      취소 (새 파일 업로드)
                    </button>
                  </div>
                </div>
              )}

              {/* 일반 오류 UI */}
              {statusBar.status === 'error' && !isResendError && (
                <div className="p-8 bg-[rgba(50,50,50)] rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold text-white mb-2">오류 발생</h2>
                  <p className="text-gray-300 mb-6">{statusBar.message}</p>
                  <button onClick={handleReset} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
                    새 파일 업로드
                  </button>
                </div>
              )}

              {/* 업로드 성공 UI */}
              {statusBar.status === 'success' && (
                <div className="p-8 bg-[rgba(50,50,50)] rounded-lg shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">업로드 완료</h2>
                  <p className="text-gray-300 mb-6">{statusBar.message}</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={handleGoToDashboard} className="px-6 py-2 bg-[rgba(111,131,175)] text-white font-semibold rounded-lg hover:bg-[rgba(101,121,165)]">대시보드로 이동</button>
                    <button onClick={handleReset} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">새 파일 업로드</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isPreviewVisible && (
        <PreviewTable
          fileName={fileName}
          factoryName={factoryName}
          previewRows={previewRows}
          previewCols={previewCols}
          productList={productList}
          productColName={productColName}
          onClose={() => setIsPreviewVisible(false)}
        />
      )}
    </div>
  );
}