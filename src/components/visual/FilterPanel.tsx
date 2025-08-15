'use client'
import React, { useState } from 'react';
import { type FilterOptions, getToLocations, anomalyCodeToNameMap  } from '../../types/data';
import { X } from 'lucide-react';

interface FilterPanelProps {
    options: FilterOptions | null;
    onApplyFilters: (filters: Record<string, any>) => void; 
    isFiltering: boolean; 
    onClose: () => void;
}

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
    anomalyType: string;
};

const initialFilterState: FilterState = {
    fromScanLocation: '', toScanLocation: '',
    min: '', max: '',
    businessStep: '', epcCode: '',
    productName: '', epcLot: '',
    eventType: '', anomalyType: '',
};

const dbDateTimeToInputString = (dbString: string): string => {
    if (!dbString) return '';
    return dbString.replace(' ', 'T').slice(0, 16);
};

const FilterPanel: React.FC<FilterPanelProps> = ({ options, onApplyFilters, isFiltering, onClose }) => {
    const [filters, setFilters] = useState<FilterState>(initialFilterState);

    const [toLocationOptions, setToLocationOptions] = useState<string[]>([]);
    const [isToLoading, setIsToLoading] = useState(false);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'fromScanLocation') {
        setFilters(prev => ({ 
            ...prev, 
            fromScanLocation: value, 
            toScanLocation: ''
        }));
        setToLocationOptions([]);
        if (value) {
            setIsToLoading(true);
            try {
                const toLocations = await getToLocations(value);
                setToLocationOptions(toLocations);
            } finally {
                setIsToLoading(false);
            }
        }
    } else {
        setFilters(prev => ({ ...prev, [name]: value }));
    }
};

    const handleApply = () => {
        const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
            if (value) {
                if (key === 'min' || key === 'max') {
                    const formattedDateTime = value.replace('T', ' ') + ':00';
                    acc[key] = formattedDateTime;
                } else {
                    acc[key] = value;
                }
            }
            return acc;
        }, {} as Record<string, any>);
        onApplyFilters(activeFilters);
    };

    const handleReset = () => {
        setFilters(initialFilterState);
        setToLocationOptions([]);
        onApplyFilters({});
    };

    if (!options) {
        return <div className="p-4 text-white text-center">필터 옵션을 불러오는 중...</div>;
    }

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
                <div>
                    <label className="block text-xs text-[#E0E0E0] mb-2 px-1">도착지</label>
                    <select
                        name="toScanLocation"
                        value={filters.toScanLocation}
                        onChange={handleInputChange}
                        disabled={!filters.fromScanLocation || isToLoading}
                        className="custom-select w-full bg-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1 focus:outline-none disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {isToLoading ? '불러오는 중...' : (filters.fromScanLocation ? '전체' : '출발지를 먼저 선택하세요')}
                        </option>
                        {toLocationOptions.map((item, index) => (
                            <option key={index} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-[#E0E0E0] mb-2 px-1">시간 범위</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="datetime-local"
                            name="min"
                            value={filters.min}
                            onChange={handleInputChange}
                            className="w-1/2 bg-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1 focus:outline-none custom-date-input"
                        />
                        <span>-</span>
                        <input
                            type="datetime-local"
                            name="max"
                            value={filters.max}
                            onChange={handleInputChange}
                            className="w-1/2 bg-[rgba(0,0,0,0.2)] rounded-lg px-3 py-1 focus:outline-none custom-date-input"
                        />
                    </div>
                </div>
                {renderSelect("물류 단계", "businessStep", options.businessSteps)}
                {renderInput("EPC", "epcCode", "EPC로 검색")}
                {renderInput("LOT 번호", "epcLot", "LOT 번호로 검색")}
                {renderSelect("제품명", "productName", options.productNames)}
                {renderSelect("이벤트 유형", "eventType", options.eventTypes)}
                {renderSelect(
                    "이상 유형",
                    "anomalyType",
                    options.anomalyTypes.map(code => anomalyCodeToNameMap[code as keyof typeof anomalyCodeToNameMap] || code),
                    options.anomalyTypes
                )}

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