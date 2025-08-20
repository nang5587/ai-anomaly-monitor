'use client';

import React, { useState, useEffect } from 'react';
import type { MergeTrip } from './SupplyChainDashboard';
import { fetchEpcHistory, type EventHistory } from '@/services/historyService';
import { fetchComments, postComment, type EpcComment } from '@/services/commentService';
import {
    X, PackagePlus, PackageMinus, Factory, ShoppingCart, Box, MessageSquare, Send
} from 'lucide-react';
import { toast } from 'sonner';

interface DetailPanelProps {
    selectedTrip: MergeTrip | null;
    onClose: () => void;
}

const EventIcon: React.FC<{ type: string }> = ({ type }) => {
    const iconClass = "w-5 h-5 text-white";
    if (type.includes('Inbound')) {
        return <PackagePlus className={iconClass} />;
    }
    if (type.includes('Outbound')) {
        return <PackageMinus className={iconClass} />;
    }
    if (type.includes('Aggregation')) {
        return <Factory className={iconClass} />;
    }
    if (type.includes('POS')) {
        return <ShoppingCart className={iconClass} />;
    }
    return <Box className={iconClass} />;
};

export const DetailPanel: React.FC<DetailPanelProps> = ({ selectedTrip, onClose }) => {
    const [fullHistory, setFullHistory] = useState<EventHistory[] | null>(null);
    const [userComment, setUserComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<EpcComment[]>([]);
    const [isCommentLoading, setIsCommentLoading] = useState(false);

    useEffect(() => {
        if (!selectedTrip) {
            setFullHistory(null);
            setComments([]); // 선택 해제 시 댓글도 초기화
            return;
        }

        setIsLoading(true);
        setError(null);

        // EPC 이력과 댓글을 병렬로 불러옵니다.
        Promise.all([
            fetchEpcHistory(selectedTrip),
            fetchComments(selectedTrip.epcCode)
        ])
            .then(([historyData, commentsData]) => {
                const sortedHistory = historyData.sort((a, b) =>
                    new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
                );
                setFullHistory(sortedHistory);
                setComments(commentsData);
            })
            .catch(err => {
                console.error(err);
                setError('이력 정보를 불러오는 데 실패했습니다.');
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, [selectedTrip]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userComment.trim()) return;

        try {
            const newComment = await postComment(selectedTrip!.epcCode, userComment);
            setComments(prevComments => [...prevComments, newComment]); // 댓글 목록에 즉시 반영
            setUserComment('');
            toast.success("의견이 성공적으로 제출되었습니다.");
        } catch (error) {
            console.error(error);
            toast.error("의견 제출에 실패했습니다.");
        }
    };

    if (!selectedTrip) return null;

    const renderContent = () => {
        if (isLoading) return <div className="flex items-center justify-center h-full">전체 이력 로딩 중...</div>;
        if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
        if (!fullHistory || fullHistory.length === 0) return <div className="flex items-center justify-center h-full">이력 정보가 없습니다.</div>;
        const firstEvent = fullHistory[0];
        const lastEvent = fullHistory[fullHistory.length - 1];
        const anomalyStartEventIds = new Set<number>();
        if (fullHistory && fullHistory.length > 1) {
            for (let i = 0; i < fullHistory.length - 1; i++) {
                const nextEvent = fullHistory[i + 1];
                if (nextEvent.anomaly > 0 || (nextEvent.anomalyTypeList && nextEvent.anomalyTypeList.length > 0)) {
                    anomalyStartEventIds.add(fullHistory[i].eventId);
                }
            }
        }
        return (
            <div className="flex flex-col h-full">
                <div className="flex-shrink-0 mb-6">
                    <h3 className="text-2xl font-lato font-bold mb-4 text-white tracking-wider">{selectedTrip.epcCode}</h3>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base font-noto-400">
                        <span className="text-gray-400">전체 출발</span>
                        <span className="text-white">{firstEvent.scanLocation}</span>
                        <span className="text-gray-400">전체 도착</span>
                        <span className="text-white">{lastEvent.scanLocation}</span>

                        <div className="col-span-2 mt-2 pt-2 border-t border-white/20"></div>
                        <span className="text-red-400">이상 경로 출발</span>
                        <span className="text-white">{selectedTrip.from.scanLocation}</span>
                        <span className="text-red-400">이상 경로 도착</span>
                        <span className="text-white">{selectedTrip.to.scanLocation}</span>
                    </div>
                </div>

                <hr className="mb-6 border-white/20 flex-shrink-0" />

                <div className="flex-grow grid grid-cols-2 gap-8 min-h-0">
                    <div className="overflow-y-auto pr-4">
                        <h4 className="text-lg font-noto-400 mb-4 text-white sticky top-0 bg-[#1A1A1A] py-2">운송 프로세스</h4>
                        <div className="relative pl-8 pt-4">
                            {fullHistory.map((event, index) => {
                                const isCurrentStepAnomaly = event.anomaly > 0 || (event.anomalyTypeList && event.anomalyTypeList.length > 0);
                                const isAnomalyPathStart = anomalyStartEventIds.has(event.eventId);
                                const isAnomalyStep = isCurrentStepAnomaly || isAnomalyPathStart;

                                return (
                                    <div key={event.eventId || `${event.scanLocation}-${event.eventTime}`} className="flex items-start mb-4 relative">
                                        {index < fullHistory.length - 1 && (
                                            <div
                                                className={`absolute w-1 ${isAnomalyPathStart ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{
                                                    left: '15px',
                                                    top: '16px',
                                                    bottom: '-16px'
                                                }}
                                            ></div>
                                        )}
                                        <div className="flex-shrink-0 w-8 h-8 z-10">
                                            {isAnomalyStep ? (
                                                <div className="relative w-full h-full">
                                                    <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping"></div>
                                                    <div className="relative w-full h-full bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className={`text-sm mb-3 ${isAnomalyStep ? 'text-red-400 font-semibold' : 'text-blue-500'}`}>
                                                {new Date(event.eventTime).toLocaleString('ko-KR', {
                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                            <div className={`mt-1 p-6 bg-[#2A2A2A] rounded-lg flex items-center gap-5 transition-all
                                                ${isAnomalyStep ? 'ring-2 ring-red-500/50' : ''}`}
                                            >
                                                <EventIcon type={event.eventType} />
                                                <span className="font-noto-400 text-white">{event.scanLocation}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="overflow-y-auto pl-4 border-l border-white/20">
                        <div className="mb-8">
                            <h4 className="text-lg font-noto-400 mb-4 text-white sticky top-0 bg-[#1A1A1A] py-2">이상 현상 분석</h4>
                            <div className="p-4 bg-[#2A2A2A] rounded-lg text-sm space-y-2">
                                <p><strong className="text-red-400">유형:</strong> {selectedTrip.anomalyTypeList.join(', ')}</p>
                                <p><strong className="text-gray-400">설명:</strong> 이 구간에서 비정상적인 이동 패턴이 감지되었습니다. 예를 들어, 예상 경로를 이탈했거나, 비정상적으로 긴 시간이 소요되었을 수 있습니다. 시스템은 이전 정상 데이터 패턴과 비교하여 이 이동을 이상으로 분류했습니다.</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-noto-400 mb-4 text-white sticky top-0 bg-[#1A1A1A] py-2">담당자 의견</h4>

                            <div className="mb-4 space-y-3 max-h-48 overflow-y-auto pr-2">
                                {comments.length > 0 ? (
                                    comments.map(comment => (
                                        <div key={comment.commentId} className="bg-[#3A3A3A] p-3 rounded-lg text-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-semibold text-white">{comment.author}</p>
                                                <p className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleString('ko-KR')}</p>
                                            </div>
                                            <p className="text-gray-300">{comment.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center text-sm py-4">등록된 의견이 없습니다.</p>
                                )}
                            </div>

                            <form onSubmit={handleCommentSubmit} className="space-y-3">
                                <textarea
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    placeholder="이 이상 현상에 대한 분석 결과나 조치 내용을 입력하세요... (예: 확인 결과 실제 도난 아님, 단순 스캔 오류로 판명)"
                                    className="w-full h-24 p-3 bg-[#2A2A2A] border border-white/20 rounded-lg text-white placeholder-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(111,131,175)] focus:border-[rgba(111,131,175)]"
                                    rows={4}
                                />
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-noto-400 bg-[#3A3A3A] hover:bg-[#4A4A4A] disabled:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:text-gray-500 rounded-lg text-white transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] focus:ring-[rgba(111,131,175)]"
                                    disabled={!userComment.trim()}
                                >
                                    <MessageSquare size={16} />
                                    의견 제출
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>

        );
    };

    return (
        <div className="text-gray-200 relative p-6">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white transition-colors z-20 p-2 rounded-full hover:bg-gray-700 cursor-pointer"
            >
                <X size={20} />
            </button>
            {renderContent()}
        </div>
    );
};