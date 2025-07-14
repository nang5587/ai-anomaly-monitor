'use client';

import { useState } from 'react';
import { type User } from './dummyData';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { changeUserFactory } from '@/api/adminApi';

const FACTORY_OPTIONS: { [key: string]: string } = {
    '1': '인천공장', '2': '화성공장', '3': '양산공장', '4': '구미공장',
};

interface ChangeFactoryModalProps {
    user: User;
    onClose: () => void;
    onSuccess: (userId: string, newFactoryId: string) => void; // 성공 시 부모에게 알리기 위한 콜백
}

export default function ChangeFactoryModal({ user, onClose, onSuccess }: ChangeFactoryModalProps) {
    const [selectedFactory, setSelectedFactory] = useState(user.locationId);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (selectedFactory === user.locationId) {
            toast.info("소속 공장이 변경되지 않았습니다.");
            return;
        }
        setIsSaving(true);
        try {
            await changeUserFactory(user.userId, Number(selectedFactory));
            toast.success(`'${user.userName}'님의 소속 공장이 변경되었습니다.`);
            onSuccess(user.userId, selectedFactory);
            onClose();
        } catch (error) {
            toast.error("공장 변경 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[rgba(40,40,40)] text-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">소속 공장 변경</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="mb-4">
                    <p className="text-sm text-gray-400">사용자: {user.userName} ({user.email})</p>
                </div>
                <div>
                    <label htmlFor="factory-select" className="block text-sm font-medium text-gray-300 mb-2">
                        변경할 공장
                    </label>
                    <select
                        id="factory-select"
                        value={selectedFactory}
                        onChange={(e) => setSelectedFactory(e.target.value)}
                        className="w-full bg-[rgba(20,20,20)] border-gray-600 rounded-md p-2 appearance-none"
                    >
                        {Object.entries(FACTORY_OPTIONS).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-md bg-[rgba(111,131,175)] hover:bg-[rgba(91,111,155)] disabled:bg-gray-500">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}