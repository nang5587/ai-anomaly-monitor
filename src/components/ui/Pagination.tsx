'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    const maxPagesToShow = 15; 

    if (totalPages <= maxPagesToShow) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (currentPage <= 3) {
            startPage = 1;
            endPage = maxPagesToShow;
        }
        if (currentPage > totalPages - 3) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) {
                pageNumbers.push('...');
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }
    }
    
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-2">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-white/70"
            >
                <ChevronLeft size={20} />
            </button>
            {pageNumbers.map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors font-lato cursor-pointer text-white/70
                            ${currentPage === page 
                                ? 'border-2 border-blue-300 text-white' 
                                : 'hover:bg-gray-700'
                            }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="px-3 py-1 text-whtie font-lato">
                        {page}
                    </span>
                )
            )}
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-white/70"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};