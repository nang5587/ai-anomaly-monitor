import React from 'react'
// import SupplyChainGraph from '@/components/visual/SupplyChainGraph'
import { SupplyChainDashboard } from '@/components/visual/SupplyChainDashboard'

export default function page() {
    return (
        <main className="flex items-center justify-center w-full h-full">
            <SupplyChainDashboard />
        </main>
    )
}
