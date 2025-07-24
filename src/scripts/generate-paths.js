// generate-paths.js (Rate Limit 및 자동 재시도 기능 강화 버전)
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const simplify = require('simplify-js');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// --- 설정 (여기서 값을 쉽게 조정할 수 있습니다) ---
const CONFIG = {
    MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    INPUT_FILE: path.resolve(__dirname, './road_paths.json'),
    OUTPUT_FILE: path.resolve(__dirname, './all-routes-geometry.json'),
    
    // 300 requests/min = 5 requests/sec = 200ms/request.
    // 네트워크 지연 등을 고려해 200ms보다 약간 긴 시간을 설정합니다.
    BASE_DELAY_MS: 220, 
    
    // API 호출 실패 시 재시도 설정
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1500, // 429 오류 발생 시 재시도 전 대기 시간 (1.5초)

    // 경로 좌표 단순화 정밀도
    SIMPLIFY_TOLERANCE: 0.0005, 
};

// --- 헬퍼 함수 ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mapbox Directions API를 호출하여 상세 경로 좌표를 받아옵니다.
 * 오류 발생 시 자동으로 재시도합니다.
 * @param {number[]} startCoord - [경도, 위도]
 * @param {number[]} endCoord - [경도, 위도]
 * @param {number | string} roadId - 로깅을 위한 roadId
 * @returns {Promise<number[][]|null>}
 */
async function getRoutePathWithRetries(startCoord, endCoord, roadId) {
    const [startLng, startLat] = startCoord;
    const [endLng, endLat] = endCoord;

    const coordinates = `${startLng},${startLat};${endLng},${endLat}`;
    const profile = 'driving';
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&overview=full&access_token=${CONFIG.MAPBOX_ACCESS_TOKEN}`;

    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url);

            // 1. API 호출 성공
            if (response.ok) {
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                    return data.routes[0].geometry.coordinates; // ✨ 성공, 좌표 반환
                }
                // 성공했지만 경로를 찾을 수 없는 경우 (거리가 너무 가깝거나 도로가 없을 때)
                console.warn(`  🟡 [roadId: ${roadId}] 경로를 찾을 수 없음 (No route found). 재시도하지 않습니다.`);
                return null;
            }

            // 2. Rate Limit 오류 (429) 발생 시
            if (response.status === 429) {
                console.warn(`  🟠 [roadId: ${roadId}] Rate Limit 초과. ${CONFIG.RETRY_DELAY_MS / 1000}초 후 재시도... (시도 ${attempt}/${CONFIG.MAX_RETRIES})`);
                await delay(CONFIG.RETRY_DELAY_MS);
                continue; // 다음 재시도 실행
            }

            // 3. 그 외 복구 불가능한 오류 (401, 404 등)
            const errorBody = await response.text();
            console.error(`  🔴 [roadId: ${roadId}] 복구 불가능한 API 오류: ${response.status} ${response.statusText}.`);
            console.error(`     - Response: ${errorBody.substring(0, 200)}...`);
            return null; // 재시도 없이 즉시 종료

        } catch (error) {
            // 4. 네트워크 오류 등
            console.error(`  🔴 [roadId: ${roadId}] 네트워크 오류 발생. 재시도... (시도 ${attempt}/${CONFIG.MAX_RETRIES})`, error.message);
            if (attempt < CONFIG.MAX_RETRIES) {
                await delay(CONFIG.RETRY_DELAY_MS);
            }
        }
    }

    // 모든 재시도 실패 시
    console.error(`  ❌ [roadId: ${roadId}] 모든 재시도 실패. 이 경로를 건너뜁니다.`);
    return null;
}

/**
 * 메인 실행 함수
 */
async function main() {
    if (!CONFIG.MAPBOX_ACCESS_TOKEN) {
        console.error("오류: .env 파일에서 NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN을 찾을 수 없습니다.");
        return;
    }

    console.log(`1. 입력 파일 읽는 중: ${CONFIG.INPUT_FILE}`);
    const inputRoutes = JSON.parse(fs.readFileSync(CONFIG.INPUT_FILE, 'utf-8'));
    const outputData = {};
    const failedRoadIds = [];

    console.log(`\n2. 총 ${inputRoutes.length}개의 경로 처리 시작... (기본 지연: ${CONFIG.BASE_DELAY_MS}ms)`);

    for (let i = 0; i < inputRoutes.length; i++) {
        const { roadId, path: routePath } = inputRoutes[i];

        if (!routePath || routePath.length < 2) {
            console.log(` - [${i + 1}/${inputRoutes.length}] Skipping roadId ${roadId}: Invalid path data.`);
            failedRoadIds.push(roadId);
            continue;
        }

        console.log(`\n[${i + 1}/${inputRoutes.length}] 처리 중 roadId: ${roadId}`);
        const detailedPath = await getRoutePathWithRetries(routePath[0], routePath[1], roadId);

        if (detailedPath) {
            const points = detailedPath.map(p => ({ x: p[0], y: p[1] }));
            const simplifiedPoints = simplify(points, CONFIG.SIMPLIFY_TOLERANCE, true);
            const simplifiedPath = simplifiedPoints.map(p => [p.x, p.y]);

            outputData[roadId] = { 
                path: simplifiedPath
            };
            console.log(`  ✅ [roadId: ${roadId}] 성공! (원본 ${detailedPath.length}개 -> 단순화 ${simplifiedPath.length}개 포인트)`);
        } else {
            failedRoadIds.push(roadId);
        }

        // 다음 API 요청 전에 기본 지연 시간만큼 대기
        await delay(CONFIG.BASE_DELAY_MS);
    }

    console.log("\n3. 최종 JSON 파일 저장 중...");
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(outputData, null, 2));

    // --- 최종 결과 요약 ---
    const successCount = Object.keys(outputData).length;
    console.log("\n" + "=".repeat(40));
    console.log("🎉 처리 완료!");
    console.log("=".repeat(40));
    console.log(`- 성공: ${successCount} / ${inputRoutes.length} 개`);
    console.log(`- 실패: ${failedRoadIds.length} / ${inputRoutes.length} 개`);
    if (failedRoadIds.length > 0) {
        console.log(`- 실패한 RoadId 목록: ${failedRoadIds.join(', ')}`);
    }
    console.log(`\n결과 파일: ${CONFIG.OUTPUT_FILE}`);
}

main().catch(console.error);