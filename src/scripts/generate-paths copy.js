// generate-paths.js (타임스탬프 생성 로직 제거 버전)
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const simplify = require('simplify-js');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// --- 설정 ---
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const INPUT_FILE = path.resolve(__dirname, './road_paths.json');
const OUTPUT_FILE = path.resolve(__dirname, './all-routes-geometry.json');
const DELAY_MS = 210;
const SIMPLIFY_TOLERANCE = 0.0001;

// --- 헬퍼 함수 ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mapbox Directions API를 호출하여 상세 경로 좌표만 받아옵니다.
 * @param {number[]} startCoord - [경도, 위도]
 * @param {number[]} endCoord - [경도, 위도]
 * @returns {Promise<number[][]|null>}
 */
async function getRoutePath(startCoord, endCoord) {
    const [startLng, startLat] = startCoord;
    const [endLng, endLat] = endCoord;

    const coordinates = `${startLng},${startLat};${endLng},${endLat}`;
    const profile = 'driving';
    
    // ✨ annotations 옵션을 제거하여 API 요청을 단순화합니다.
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`  - Error fetching route: ${response.status} ${response.statusText}. Body: ${errorBody}`);
            return null;
        }
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            return data.routes[0].geometry.coordinates; // ✨ 좌표 배열만 반환
        }
        console.error(`  - No route found in response.`);
        return null;
    } catch (error) {
        console.error(`  - Request failed:`, error);
        return null;
    }
}

/**
 * 메인 실행 함수
 */
async function main() {
    if (!MAPBOX_ACCESS_TOKEN) {
        console.error("오류: .env 파일에서 NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN을 찾을 수 없습니다.");
        return;
    }

    console.log(`1. 입력 파일 읽는 중: ${INPUT_FILE}`);
    const inputRoutes = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    const outputData = {};

    console.log(`2. 총 ${inputRoutes.length}개의 경로 처리 시작...`);

    for (let i = 0; i < inputRoutes.length; i++) {
        const routeInfo = inputRoutes[i];
        const { roadId, path: routePath } = routeInfo;

        if (!routePath || routePath.length < 2) {
            console.log(` - [${i + 1}/${inputRoutes.length}] Skipping roadId ${roadId}: Invalid path data.`);
            continue;
        }

        console.log(` - [${i + 1}/${inputRoutes.length}] Processing roadId: ${roadId}`);
        const detailedPath = await getRoutePath(routePath[0], routePath[1]);

        if (detailedPath) {
            // 경로 단순화 (simplify-js 사용)
            const points = detailedPath.map(p => ({ x: p[0], y: p[1] }));
            const simplifiedPoints = simplify(points, SIMPLIFY_TOLERANCE, true);
            const simplifiedPath = simplifiedPoints.map(p => [p.x, p.y]);

            // ✨ 최종 결과물에 path 속성만 저장합니다.
            outputData[roadId] = { 
                path: simplifiedPath
            };
            console.log(`  -> 성공! 원본 ${detailedPath.length}개 -> 단순화 ${simplifiedPath.length}개 포인트 생성.`);
        } else {
            console.log(`  -> 실패. 상세 경로를 가져오지 못했습니다.`);
        }

        await delay(DELAY_MS);
    }

    console.log("3. 최종 JSON 파일 저장 중...");
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log(`🎉 완료! ${OUTPUT_FILE} 파일이 생성되었습니다.`);
}

main();