import type { FileItem } from '@/types/file';
import { CoverReportData } from "@/types/api";
import type { JoinFormData } from '@/types/join';

const DUMMY_FILES: FileItem[] = [
    { fileId: 1, fileName: "수원-물류센터-A.csv", createdAt: "2025-08-15T10:00:00Z", userId: "김수원", status: "DONE" },
    { fileId: 2, fileName: "인천-창고-B.csv", createdAt: "2025-08-14T14:30:00Z", userId: "박인천", status: "DONE" },
    { fileId: 3, fileName: "구미-공장-C.csv", createdAt: "2025-08-13T09:00:00Z", userId: "이구미", status: "ERROR" },
];
const DUMMY_COVER_DB: Record<number, CoverReportData> = {
    1: { fileName: "수원-물류센터-A.csv", userName: "김수원", locationId: 1, createdAt: "2025-08-15T10:00:00Z", period: ["2025-08-01", "2025-08-15"] },
    2: { fileName: "인천-창고-B.csv", userName: "박인천", locationId: 2, createdAt: "2025-08-14T14:30:00Z", period: ["2025-08-01", "2025-08-14"] },
};
const DUMMY_EXISTING_IDS = ['admin', 'test', 'exists'];

const mockDelay = (delay = 500) => new Promise(res => setTimeout(res, delay));

console.log(" MOCK API CLIENT LOADED ");


export async function getFiles_client(): Promise<FileItem[]> {
    console.log("[MOCK] getFiles_client called");
    await mockDelay();
    return DUMMY_FILES;
}

export const markFileAsDeleted = async (fileId: number) => {
    console.log(`[MOCK] markFileAsDeleted called for fileId: ${fileId}`);
    await mockDelay();
    // 실제 데이터는 수정하지 않지만, 성공한 것처럼 응답
    return { status: 200, data: { message: "File marked as deleted" } };
};

export async function getCoverReportData(params: { fileId: number }): Promise<CoverReportData> {
    console.log(`[MOCK] getCoverReportData called for fileId: ${params.fileId}`);
    await mockDelay();
    const data = DUMMY_COVER_DB[params.fileId];
    if (data) return data;
    throw new Error(`[MOCK] No cover data found for fileId: ${params.fileId}`);
}

export const checkUserId_client = async (userId: string): Promise<boolean> => {
    console.log(`[MOCK] checkUserId_client called for userId: ${userId}`);
    await mockDelay();
    // 아이디가 더미 배열에 있으면 true (중복) 반환
    return DUMMY_EXISTING_IDS.includes(userId);
};

export const joinUser_client = async (formData: JoinFormData) => {
    console.log("[MOCK] joinUser_client called with data:", formData);
    await mockDelay(1000);
    return { message: "Mock join successful" };
};

export const fileResend_client = async (fileId: number) => {
    console.log(`[MOCK] fileResend_client called for fileId: ${fileId}`);
    await mockDelay();
    return { message: `File ${fileId} resend requested successfully` };
};

export default {};