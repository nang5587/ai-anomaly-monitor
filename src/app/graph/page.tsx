import React from 'react'
// import SupplyChainGraph from '@/components/visual/SupplyChainGraph'
import { SupplyChainMap } from '@/components/visual/SupplyChainMap'

export default function page() {
    return (
        <main className="flex items-center justify-center w-full h-full">
            {/* <SupplyChainGraph /> */}
            <SupplyChainMap />
        </main>
    )
}
