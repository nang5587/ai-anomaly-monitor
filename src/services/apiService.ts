import * as realApi from '@/api/apiClient';
import * as mockApi from './mockApiService';

const useMock = process.env.NEXT_PUBLIC_MOCK_API === 'true';
const api = useMock ? mockApi : realApi;

export const getFiles_client = api.getFiles_client;
export const markFileAsDeleted = api.markFileAsDeleted;
export const getCoverReportData = api.getCoverReportData;
export const checkUserId_client = api.checkUserId_client;
export const joinUser_client = api.joinUser_client;
export const fileResend_client = api.fileResend_client;