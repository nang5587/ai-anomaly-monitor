// src/app/graph/page.js

import { SupplyChainDashboard } from '../../components/visual/SupplyChainDashboard';
import { Suspense } from 'react';
import Loading from './loading';

export const dynamic = 'force-dynamic';

export default async function GraphPage() {
    // 이제 page.js는 데이터를 가져오지 않습니다.
    // 모든 데이터 로딩은 클라이언트 컴포넌트와 Jotai가 담당합니다.
    return (
        <Suspense fallback={<Loading />}>
            <SupplyChainDashboard />
        </Suspense>
    );
}