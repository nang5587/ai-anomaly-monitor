import { SupplyChainDashboard } from '../../components/visual/SupplyChainDashboard';
import { Suspense } from 'react';
import Loading from './loading';
import {
    getNodes_server,
    getTrips_server,
    getFilterOptions_server
} from '@/api/apiServer';
import { v4 as uuidv4 } from 'uuid';
import type { TripWithId } from '../../components/visual/SupplyChainDashboard';
import type { FilterOptions } from '../../components/visual/data';
export const dynamic = 'force-dynamic';


export default async function page() {

    try {
        const [
            nodes,
            tripsResponse,
            filterOptions
        ] = await Promise.all([
            getNodes_server(),
            getTrips_server({ limit: 100 }), // 지도에 표시할 초기 데이터 개수를 적절히 조절
            getFilterOptions_server()
        ]);

        const serializableFilterOptions = JSON.parse(JSON.stringify(filterOptions));
        const tripsWithId: TripWithId[] = tripsResponse.data.map(trip => ({
            ...trip,
            id: uuidv4() // 각 trip 객체에 id 속성을 추가
        }));

        const initialData = {
            nodes: nodes,
            trips: tripsWithId,
            filterOptions: filterOptions,
            nextCursor: tripsResponse.nextCursor
        };

        return (
            <Suspense fallback={<Loading />}>
                <main className="flex items-center justify-center w-full h-full">
                    <SupplyChainDashboard
                    />
                    <script
                        id="__INITIAL_DATA__"
                        type="application/json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify(initialData),
                        }}
                    />
                </main>
            </Suspense>
        );
    } catch (error) {
        console.error("Failed to load initial data for GraphPage:", error);

        // 5. 데이터 로딩 중 에러가 발생하면 사용자에게 에러 메시지를 보여줍니다.
        //    (더 나은 방법은 error.tsx 파일을 사용하는 것입니다)
        return (
            <main className="flex items-center justify-center w-full h-full">
                <div className="text-center p-8 bg-red-900 bg-opacity-30 rounded-lg">
                    <h2 className="text-2xl font-bold text-red-400 mb-2">데이터 로딩 실패</h2>
                    <p className="text-red-300">페이지를 새로고침하거나 나중에 다시 시도해주세요.</p>
                </div>
            </main>
        );
    }
}