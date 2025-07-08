// components/features/user-management/ApprovalModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApprovalFormData } from './UserManagementClient'; // 부모 컴포넌트에서 타입 임포트

type User = { userId: string; userName: string; email: string };

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onConfirm: (data: ApprovalFormData) => void; // ⬅️ 부모로부터 받을 승인 함수
    isSubmitting: boolean; // ⬅️ 부모로부터 받을 로딩 상태
}

export function ApprovalModal({ isOpen, onClose, user, onConfirm, isSubmitting }: Props) {
    const [role, setRole] = useState<'MANAGER' | 'UNAUTH'>('UNAUTH');
    const [factoryCode, setFactoryCode] = useState<string>('');

    // 모달이 열릴 때마다 상태 초기화
    useEffect(() => {
        if (isOpen) {
            setRole('UNAUTH');
            setFactoryCode('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (role === 'MANAGER' && !factoryCode) {
            alert('MANAGER 역할은 담당 공장을 반드시 선택해야 합니다.');
            return;
        }

        onConfirm({ role, factoryCode });
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>'{user.userName}'님 승인 처리</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div>
                        <Label>역할 배정</Label>
                        <RadioGroup value={role} onValueChange={(value: 'MANAGER' | 'UNAUTH') => setRole(value)} className="mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="MANAGER" id="r1" /><Label htmlFor="r1">MANAGER</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="UNAUTH" id="r2" /><Label htmlFor="r2">UNAUTH</Label></div>
                        </RadioGroup>
                    </div>

                    {role === 'MANAGER' && (
                        <div>
                            <Label htmlFor="factory">담당 공장</Label>
                            <Select onValueChange={setFactoryCode} value={factoryCode} required>
                                <SelectTrigger><SelectValue placeholder="공장을 선택하세요" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="101">화성공장</SelectItem>
                                    <SelectItem value="102">인천공장</SelectItem>
                                    <SelectItem value="103">구미공장</SelectItem>
                                    <SelectItem value="104">양산공장</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>취소</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '처리 중...' : '최종 승인'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}