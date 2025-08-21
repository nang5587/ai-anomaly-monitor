const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export const fetchRouteGeometry = async (
    startCoord: [number, number],
    endCoord: [number, number]
): Promise<[number, number][] | null> => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoord.join(',')};${endCoord.join(',')}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Mapbox API 에러: ${response.statusText}`);
            return [startCoord, endCoord];
        }
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const fullPath = data.routes[0].geometry.coordinates as [number, number][];
            return fullPath;
        }
        
        return [startCoord, endCoord];

    } catch (error) {
        console.error("Mapbox API 호출 실패:", error);
        return [startCoord, endCoord];
    }
};