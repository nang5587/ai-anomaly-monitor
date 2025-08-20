import { NextResponse } from 'next/server';

async function getHistoryFromDatabase(epcCode: string) {
    throw new Error("Database connection not implemented");
}

export async function GET(
    request: Request,
    { params }: { params: { epc: string } }
) {
    const epcCode = params.epc;
    try {
        const history = await getHistoryFromDatabase(epcCode);
        return NextResponse.json(history);
    } catch (error) {
        console.error(`Error fetching history for EPC ${epcCode}:`, error);
        return new NextResponse('Error fetching data from the database', { status: 500 });
    }
}