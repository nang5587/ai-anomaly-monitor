import {
    KpiSummary,
    AnalyzedTrip,
    PaginatedTripsResponse,
    LocationNode,
    InventoryDistributionResponse,
    ByProductResponse,
    FilterOptions,
} from '@/types/data';

const mockDelay = (delay = 300) => new Promise(res => setTimeout(res, delay + Math.random() * 200));

let tripDataCache: { trips: AnalyzedTrip[], anomalies: AnalyzedTrip[] } | null = null;
let nodeCache: LocationNode[] | null = null;

async function ensureTripCache() {
    if (tripDataCache === null) {
        console.log(`[MOCK] Trip/Anomaly cache not found. Fetching from JSON...`);
        try {
            const [tripsRes, anomaliesRes] = await Promise.all([
                fetch('/api/trips.json'),
                fetch('/api/anomalies.json')
            ]);

            if (!tripsRes.ok || !anomaliesRes.ok) {
                throw new Error('Failed to fetch dummy data JSON');
            }

            const tripsJson = await tripsRes.json();
            const anomaliesJson = await anomaliesRes.json();

            tripDataCache = {
                trips: tripsJson.data || tripsJson,
                anomalies: anomaliesJson.data || anomaliesJson,
            };
        } catch (error) {
            console.error(error);
            tripDataCache = { trips: [], anomalies: [] };
        }
    }
}

async function ensureNodeCache() {
    if (nodeCache === null) {
        console.log(`[MOCK] Node cache not found. Fetching from JSON...`);
        try {
            const response = await fetch('/api/nodes.json');
            if (!response.ok) throw new Error('Failed to fetch nodes.json');
            nodeCache = await response.json();
        } catch (error) {
            console.error(error);
            nodeCache = [];
        }
    }
}

export async function getAnomalies(params: { fileId?: number, limit?: number, cursor?: string }): Promise<PaginatedTripsResponse> {
    console.log(`[MOCK] getAnomalies from JSON with cursor: ${params?.cursor}`);
    await ensureTripCache(); // 캐시 확인 및 로딩

    const allAnomalies = tripDataCache?.anomalies || [];
    const limit = params?.limit || 50;
    const startIndex = params?.cursor ? Number(params.cursor) : 0;

    const paginatedData = allAnomalies.slice(startIndex, startIndex + limit);
    const nextCursor = (startIndex + limit < allAnomalies.length) ? (startIndex + limit).toString() : null;

    await mockDelay();
    return { data: paginatedData, nextCursor };
}

export async function getAllAnomalies(params?: { fileId?: number }): Promise<AnalyzedTrip[]> {
    console.log(`[MOCK] getAllAnomalies from JSON`);
    await ensureTripCache();
    await mockDelay();
    return tripDataCache?.anomalies || [];
}

export async function getTrips(params?: { fileId?: number, limit?: number, cursor?: string }): Promise<PaginatedTripsResponse> {
    console.log(`[MOCK] getTrips from JSON with cursor: ${params?.cursor}`);
    await ensureTripCache();

    const allTrips = tripDataCache?.trips || [];
    const limit = params?.limit || 50;
    const startIndex = params?.cursor ? Number(params.cursor) : 0;

    const paginatedData = allTrips.slice(startIndex, startIndex + limit);
    const nextCursor = (startIndex + limit < allTrips.length) ? (startIndex + limit).toString() : null;

    await mockDelay();
    return { data: paginatedData, nextCursor };
}

export async function getNodes(): Promise<LocationNode[]> {
    console.log("[MOCK] getNodes from JSON");
    await ensureNodeCache();
    await mockDelay(100);
    return nodeCache || [];
}


export async function getKpiSummary(params?: { fileId?: number }): Promise<KpiSummary> {
    console.log(`[MOCK] getKpiSummary calculated from JSON`);
    await ensureTripCache();

    const totalTripCount = tripDataCache?.trips.length || 0;
    const anomalyCount = tripDataCache?.anomalies.length || 0;

    await mockDelay();
    return {
        totalTripCount,
        anomalyCount,
        uniqueProductCount: 12,
        codeCount: 2000,
        anomalyRate: 0.0001,
        salesRate: 85.5,
        dispatchRate: 92.1,
        inventoryRate: 78.2,
        avgLeadTime: 8.5
    };
}

export async function getInventoryDistribution(params?: { fileId?: number }): Promise<InventoryDistributionResponse> {
    await mockDelay();
    return {
        inventoryDistribution: [
            { "businessStep": "Factory", "value": 12050 }, { "businessStep": "WMS", "value": 25800 },
            { "businessStep": "LogiHub", "value": 17300 }, { "businessStep": "Wholesaler", "value": 35100 },
            { "businessStep": "Reseller", "value": 48200 }, { "businessStep": "POS", "value": 31540 }
        ]
    };
}

export async function getAnomalyCountsByProduct(params?: { fileId?: number }): Promise<ByProductResponse> {
    console.log("[MOCK] getAnomalyCountsByProduct calculated from JSON");
    await ensureTripCache();

    const thresholdValue = parseFloat(process.env.NEXT_PUBLIC_ANOMALY_THRESHOLD || '50');

    const counts = (tripDataCache?.anomalies || []).reduce((acc, trip) => {
        if (!trip.productName) return acc;
        if (!acc[trip.productName]) {
            acc[trip.productName] = {
                productName: trip.productName,
                fake: 0,
                tamper: 0,
                clone: 0,
                other: 0,
                total: 0
            };
        }

        trip.anomalyTypeList?.forEach(type => {
            if (type in acc[trip.productName]) {
                acc[trip.productName][type]++;
            }
        });

        const isAiBased = typeof trip.anomaly === 'number' && trip.anomaly >= thresholdValue;
        if (isAiBased) {
            acc[trip.productName].other++;
        }

        acc[trip.productName].total =
            acc[trip.productName].fake +
            acc[trip.productName].tamper +
            acc[trip.productName].clone +
            acc[trip.productName].other;

        return acc;
    }, {} as Record<string, { productName: string; fake: number; tamper: number; clone: number; other: number; total: number; }>);

    await mockDelay();
    return Object.values(counts);
}



export async function getFilterOptions(params?: { fileId?: number }): Promise<FilterOptions> {
    console.log("[MOCK] getFilterOptions calculated from JSON");
    await ensureTripCache();

    const allTrips = tripDataCache?.trips || [];

    const scanLocations = new Set<string>();
    const businessSteps = new Set<string>();
    const productNames = new Set<string>();
    const eventTypes = new Set<string>();
    const anomalyTypes = new Set<string>();

    allTrips.forEach(trip => {
        scanLocations.add(trip.from.scanLocation);
        scanLocations.add(trip.to.scanLocation);
        businessSteps.add(trip.from.businessStep);
        businessSteps.add(trip.to.businessStep);
        productNames.add(trip.productName);
        eventTypes.add(trip.eventType);
        trip.anomalyTypeList.forEach(type => anomalyTypes.add(type));
    });

    await mockDelay(200);

    return {
        scanLocations: Array.from(scanLocations),
        businessSteps: Array.from(businessSteps),
        productNames: Array.from(productNames),
        eventTypes: Array.from(eventTypes),
        anomalyTypes: Array.from(anomalyTypes),
        eventTimeRange: ['2025-01-01T00:00:00Z', '2025-12-31T23:59:59Z'],
    };
}