const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const simplifyPath = (path: [number, number][], points: number = 5): [number, number][] => {
    if (path.length <= points) {
        return path;
    }
    const simplified: [number, number][] = [];
    const totalPoints = path.length;
    const interval = (totalPoints - 1) / (points - 1);

    for (let i = 0; i < points; i++) {
        const index = Math.round(i * interval);
        simplified.push(path[index]);
    }
    return simplified;
};

export const fetchRouteGeometry = async (
    startCoord: [number, number],
    endCoord: [number, number]
): Promise<[number, number][] | null> => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoord.join(',')};${endCoord.join(',')}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Mapbox API 에러: ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            const fullPath = data.routes[0].geometry.coordinates as [number, number][];
            return simplifyPath(fullPath, 5);
        }
        return null;
    } catch (error) {
        console.error("Mapbox API 호출 실패:", error);
        return null;
    }
};