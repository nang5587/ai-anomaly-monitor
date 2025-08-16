import * as realApi from '@/types/data';    
import * as mockApi from './mockDataService';

const useMock = process.env.NEXT_PUBLIC_MOCK_API === 'true';

const api = useMock ? mockApi : realApi;

export const getKpiSummary = api.getKpiSummary;
export const getAnomalies = api.getAnomalies;
export const getAllAnomalies = api.getAllAnomalies;
export const getInventoryDistribution = api.getInventoryDistribution;
export const getAnomalyCountsByProduct = api.getAnomalyCountsByProduct;
export const getNodes = api.getNodes;
export const getTrips = api.getTrips;
export const getFilterOptions = api.getFilterOptions;