'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Filter, Search, Sheet } from 'lucide-react';

import { useAtomValue } from 'jotai'; // ✨ useAtomValue import
import { statusBarAtom } from '@/stores/uiAtoms';

export const STATUS_BAR_HEIGHT_PX = 80;

const getColumnName = (index: number) => {
    let name = '';
    let i = index;
    while (i >= 0) {
        name = String.fromCharCode(65 + (i % 26)) + name;
        i = Math.floor(i / 26) - 1;
    }
    return name;
};

// PreviewTable이 받을 props 타입을 정의합니다.
interface PreviewTableProps {
    fileName: string;
    factoryName: string;
    previewRows: any[];
    previewCols: string[];
    productList: string[];
    productColName: string | null;
    onClose: () => void; // handleReset 함수를 props로 받습니다.
}

export default function PreviewTable({
    fileName,
    factoryName,
    previewRows,
    previewCols,
    productList,
    productColName,
    onClose,
}: PreviewTableProps) {
    // --- 미리보기 화면에서만 사용하는 상태들을 여기로 옮깁니다. ---
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState('전체');
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [enableFilter, setEnableFilter] = useState(false);
    const [searchColumn, setSearchColumn] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
    const [formulaBarContent, setFormulaBarContent] = useState('');
    const rowsPerPage = 100;

    const statusBar = useAtomValue(statusBarAtom);
    const statusBarHeight = 78;

    // --- 기존의 useMemo 훅들을 그대로 옮깁니다. ---
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

    // --- 핸들러 함수들도 여기로 옮깁니다. ---
    const handleFilterChange = (col: string, value: string) => {
        setFilters((prev) => ({ ...prev, [col]: value }));
        setCurrentPage(1);
    };
    const handleCellClick = (rowIndex: number, colName: string, content: any) => {
        setSelectedCell({ row: rowIndex, col: colName });
        setFormulaBarContent(content?.toString() ?? '');
    };

    // onReset은 props로 받은 함수를 호출합니다.
    const handleClose = () => {
        onClose();
    }

    return (
        <div className="fixed inset-0 z-60 flex flex-col w-full h-full bg-gray-100 text-sm"
            style={{
                top: 0,
            }}
        >
            {/* 리본 메뉴 (툴바) */}
            <div className="flex-shrink-0 bg-gray-200 p-2 flex items-center gap-4 border-b border-gray-300">
                <Sheet size={20} className="text-green-700" />
                <div className="font-bold text-gray-800">{fileName}</div>
                <div className="w-px h-6 bg-gray-400"></div>
                <select
                    value={selectedProduct}
                    onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}
                    className="px-2 py-1 border border-gray-400 rounded bg-white"
                >
                    <option value="전체">모든 제품</option>
                    {productList.slice(1).map((product, idx) => (
                        <option key={idx} value={product}>{product}</option>
                    ))}
                </select>
                <div className="flex items-center gap-1">
                    <Search size={16} className="text-gray-600" />
                    <select
                        value={searchColumn}
                        onChange={(e) => setSearchColumn(e.target.value)}
                        className="px-2 py-1 border border-gray-400 rounded bg-white"
                    >
                        <option value="">검색할 열...</option>
                        {previewCols.map((col) => (
                            <option key={col} value={col}>{col}</option>
                        ))}
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
                    <button
                        onClick={() => setEnableFilter(!enableFilter)}
                        className={`px-3 py-1 text-sm border border-gray-400 rounded flex items-center cursor-pointer gap-2 ${enableFilter ? 'bg-[rgba(111,131,175)] text-white' : 'bg-white'}`}
                    >
                        <Filter size={14} /> {enableFilter ? '필터 숨기기' : '필터 표시'}
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full hover:bg-gray-300 cursor-pointer"
                        aria-label="닫기"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* 수식 입력줄 */}
            <div className="flex-shrink-0 bg-white p-1 flex items-center border-b border-gray-300">
                <div className="px-2 py-0.5 text-gray-500 font-mono text-xs border-r border-gray-300 mr-2">fx</div>
                <input
                    type="text"
                    readOnly
                    value={formulaBarContent}
                    className="w-full bg-transparent outline-none text-gray-800"
                />
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
    );
}