// src/app/graph/page.js

import { SupplyChainDashboard } from '../../components/visual/SupplyChainDashboard';
import { Suspense } from 'react';
import Loading from './loading';

export const dynamic = 'force-dynamic';

export default async function GraphPage() {
    return (
        <Suspense fallback={<Loading />}>
            <SupplyChainDashboard />
        </Suspense>
    );
}