'use client'
import React, { useState } from 'react';
import type { FilterOptions } from './data'; // data.ts에서 타입을 가져옵니다.
import { X } from 'lucide-react';

// 부모 컴포넌트로부터 받을 props 타입 정의
interface FilterPanelProps {
    options: FilterOptions | null; // 필터 목록 (scanLocations, productNames 등)
    onApplyFilters: (filters: Record<string, any>) => void; // 필터 적용 시 호출될 함수
    isFiltering: boolean; // 부모 컴포넌트가 데이터를 로딩 중인지 여부
    onClose: () => void;
}

// 필터 입력 값들의 상태 타입을 명시적으로 정의
type FilterState = {
    fromScanLocation: string;
    toScanLocation: string;
    min: string;
    max: string;
    businessStep: string;
    epcCode: string;
    productName: string;
    epcLot: string;
    eventType: string;
    anomaly: string;
};

// 필터 상태 초기값
const initialFilterState: FilterState = {
    fromScanLocation: '', toScanLocation: '',
    min: '', max: '',
    businessStep: '', epcCode: '',
    productName: '', epcLot: '',
    eventType: '', anomaly: '',
};

const FilterPanel: React.FC<FilterPanelProps> = ({ options, onApplyFilters, isFiltering, onClose }) => {
    const [filters, setFilters] = useState<FilterState>(initialFilterState);

    // 입력 값 변경 핸들러 (모든 input/select에 공통으로 사용)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // '필터 적용' 버튼 클릭 핸들러
    const handleApply = () => {
        // ✨ 날짜 문자열('YYYY-MM-DD')을 Unix 타임스탬프(초)로 변환하여 API에 전송
        const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
            if (value) {
                if (key === 'min' || key === 'max') {
                    const formatted = value.replace('T', ' ') + ':00'; // 초 붙이기
                    acc[key] = formatted;
                } else {
                    acc[key] = value;
                }
            }
            return acc;
        }, {} as Record<string, any>);
        onApplyFilters(activeFilters);
    };

    // '초기화' 버튼 클릭 핸들러
    const handleReset = () => {
        setFilters(initialFilterState);
        onApplyFilters({}); // 빈 객체를 전달하여 필터를 모두 해제하고 전체 목록을 다시 로드
    };

    // 필터 옵션이 아직 로드되지 않았을 경우 로딩 상태 표시
    if (!options) {
        return <div className="p-4 text-white text-center">필터 옵션을 불러오는 중...</div>;
    }

    // --- 헬퍼 함수 (JSX 가독성 향상) ---
    const renderInput = (label: string, name: keyof FilterState, placeholder: string) => (
        <div>
            <label className="block text-xs text-[#E0E0E0] mb-2 px-1">{label}</label>
            <input type="text" name={name} value={filters[name]} onChange={handleInputChange} placeholder={placeholder}
                className="w-full bg-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1 focus:outline-none" />
        </div>
    );

    const renderSelect = (label: string, name: keyof FilterState, items: string[], values?: string[]) => (
        <div>
            <label className="block text-xs text-[#E0E0E0] mb-2 px-1">{label}</label>
            <select name={name} value={filters[name]} onChange={handleInputChange}
                className="custom-select w-full bg-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1 focus:outline-none">
                <option value="">전체</option>
                {items.map((item, index) => (
                    <option key={index} value={values ? values[index] : item}>{item}</option>
                ))}
            </select>
        </div>
    );

    const renderTimeRange = (label: string, range: { min: number, max: number }) => {
        // Unix 타임스탬프를 'YYYY-MM-DD' 형식의 문자열로 변환하는 간단한 내장 함수
        const toDateTimeLocal = (unix: number) => {
            const d = new Date(unix * 1000);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        return (
            <div>
                <label className="block text-xs text-[#E0E0E0] mb-2 px-1">{label}</label>
                <div className="flex items-center space-x-2">
                    {/* ✨ input 타입을 'date'로 변경 */}
                    <input
                        type="datetime-local"
                        name="min"
                        value={filters.min}
                        onChange={handleInputChange}
                        // input type="date"는 min, max 속성으로 날짜 범위를 제한할 수 있음
                        min={toDateTimeLocal(range.min)}
                        max={toDateTimeLocal(range.max)}
                        className="w-1/2 bg-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1 focus:outline-none custom-date-input"
                    />
                    <span>-</span>
                    <input
                        type="datetime-local"
                        name="max"
                        value={filters.max}
                        onChange={handleInputChange}
                        min={toDateTimeLocal(range.min)}
                        max={toDateTimeLocal(range.max)}
                        className="w-1/2 bg-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1 focus:outline-none custom-date-input"
                    />
                </div>
            </div>
        );
    };

    // --- 최종 렌더링 ---
    return (
        <div style={{
            height: '100%',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            borderRadius: '25px',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 20px',
                flexShrink: 0,
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                }}>상세 필터</h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="필터 패널 닫기"
                >
                    <X size={20} />
                </button>
            </div>
            <div style={{
                overflowY: 'auto',
                flex: 1,
                padding: '10px 15px',
            }}
                className="space-y-3 hide-scrollbar"
            >
                {renderSelect("출발지", "fromScanLocation", options.scanLocations)}
                {renderSelect("도착지", "toScanLocation", options.scanLocations)}
                {renderTimeRange("시간", options.eventTimeRange)}
                {renderSelect("물류 단계", "businessStep", options.businessSteps)}
                {renderInput("EPC", "epcCode", "EPC로 검색")}
                {renderInput("LOT 번호", "epcLot", "LOT 번호로 검색")}
                {renderSelect("제품명", "productName", options.productNames)}
                {renderSelect("이벤트 유형", "eventType", options.eventTypes)}
                {renderSelect("이상 유형", "anomaly", options.anomalyTypes.map(a => a.name), options.anomalyTypes.map(a => a.code))}

            </div>

            <div style={{
                padding: '20px',
            }} className="flex items-center space-x-2 pt-4 ">
                <button onClick={handleApply} disabled={isFiltering} className="font-noto-400 flex-1 bg-[rgba(111,131,175)] hover:bg-[rgba(101,121,165)] rounded-xl px-4 py-2 disabled:bg-gray-500 transition-colors">
                    {isFiltering ? '적용 중...' : '필터 적용'}
                </button>
                <button onClick={handleReset} className="font-noto-400 bg-[#E0E0E0] hover:bg-[#c2c2c2] rounded-xl px-4 py-2 transition-colors text-black/80">초기화</button>
            </div>
        </div>
    );
};

export default FilterPanel;