import type { MergeTrip } from "@/context/MapDataContext";

export interface EventHistory {
    eventId: number;
    epcCode: string;
    locationId: number;
    scanLocation: string;
    hubType: string;
    businessStep: string;
    eventType: string;
    eventTime: string;
    anomaly: number;
    anomalyTypeList: string[];
}

interface HistoryApiResponse {
    data: EventHistory[];
}

export async function fetchEpcHistory(selectedTrip: MergeTrip): Promise<EventHistory[]> {
    const { epcCode } = selectedTrip;

    if (process.env.NEXT_PUBLIC_MOCK_API === "true") {
        console.log(`[MOCK SERVICE] Fetching history for ${epcCode} from local JSON file.`);
        try {
            const response = await fetch('/api/epc_history.json');
            if (!response.ok) {
                throw new Error("Failed to load mock history file.");
            }
            const allHistory: HistoryApiResponse = await response.json();
            
            const filteredHistory = allHistory.data.filter(event => event.epcCode === epcCode);

            return filteredHistory.sort((a, b) => 
                new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
            );

        } catch (error) {
            console.error("Error fetching or parsing mock history file:", error);
            return [];
        }
    } 
    else {
        const response = await fetch(`/api/history/${epcCode}`);
        if (!response.ok) {
            throw new Error("Failed to fetch EPC history from API");
        }
        const apiResponse: HistoryApiResponse = await response.json();
        return apiResponse.data.sort((a, b) => 
            new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
        );
    }
}