// services/historyService.ts
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

const createDummyHistory = (selectedTrip: MergeTrip): EventHistory[] => {
    const { epcCode } = selectedTrip;
    const baseTime = new Date("2025-08-15T09:00:00");
    const flowTemplate = [
        { eventId: 1001, locationId: 20, scanLocation: "인천공장", hubType: "ICN_Factory", businessStep: "Factory", eventType: "Aggregation" },
        { eventId: 1002, locationId: 21, scanLocation: "인천공장창고", hubType: "ICN_WMS_Inbound", businessStep: "WMS", eventType: "WMS_Inbound" },
        { eventId: 1003, locationId: 21, scanLocation: "인천공장창고", hubType: "ICN_WMS_Outbound", businessStep: "WMS", eventType: "WMS_Outbound" },
        { eventId: 1004, locationId: 17, scanLocation: "수도권물류센터", hubType: "SEL_Logi_HUB_Inbound", businessStep: "LogiHub", eventType: "HUB_Inbound" },
        { eventId: 1005, locationId: 17, scanLocation: "수도권물류센터", hubType: "SEL_Logi_HUB_Outbound", businessStep: "LogiHub", eventType: "HUB_Outbound" },
        { eventId: 1006, locationId: 9, scanLocation: "임시 출발지", hubType: "FROM_HUB", businessStep: "Wholesaler", eventType: "W_Stock_Outbound" },
        { eventId: 1007, locationId: 2, scanLocation: "임시 도착지", hubType: "TO_HUB", businessStep: "Wholesaler", eventType: "W_Stock_Inbound" },
        { eventId: 1008, locationId: 10, scanLocation: "수도권_도매상1_권역_소매상1", hubType: "SEL_WS1_Rsell1_Stock_Inbound", businessStep: "Reseller", eventType: "R_Stock_Inbound" },
        { eventId: 1009, locationId: 10, scanLocation: "수도권_도매상1_권역_소매상1", hubType: "SEL_WS1_Rsell1_Stock_Outbound", businessStep: "Reseller", eventType: "R_Stock_Outbound" },
        { eventId: 1010, locationId: 15, scanLocation: "수도권_소매상1_POS", hubType: "SEL_RS1_POS_Sell", businessStep: "POS", eventType: "POS_Sell" },
    ];

    const dynamicFlow = flowTemplate.map((step, index) => {
        if (index === 5) {
            return {
                ...step,
                scanLocation: selectedTrip.from.scanLocation,
                businessStep: selectedTrip.from.businessStep,
            };
        }
        if (index === 6) {
            return {
                ...step,
                scanLocation: selectedTrip.to.scanLocation,
                businessStep: selectedTrip.to.businessStep,
            };
        }
        return step;
    });

    return dynamicFlow.map((step, index) => {
        const isAnomalyStep = index === 6; 
        const eventTime = new Date(baseTime.getTime() + index * 6 * 60 * 60 * 1000);

        return {
            ...step,
            epcCode,
            eventTime: eventTime.toISOString(),
            anomaly: isAnomalyStep ? 0.95 : 0,
            anomalyTypeList: isAnomalyStep ? selectedTrip.anomalyTypeList : [],
        };
    });
};

export async function fetchEpcHistory(selectedTrip: MergeTrip): Promise<EventHistory[]> {
    if (process.env.NEXT_PUBLIC_MOCK_API === "true") {
        return Promise.resolve(createDummyHistory(selectedTrip));
    } else {
        const response = await fetch(`/api/history/${selectedTrip.epcCode}`);
        if (!response.ok) {
            throw new Error("Failed to fetch EPC history");
        }
        return response.json();
    }
}
