import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get('reportId');

  if (!reportId) {
    return NextResponse.json({ error: 'reportId가 없습니다.' }, { status: 400 });
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: '해당 리포트를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      title: report.title,
      details: report.details,
      summaryStats: report.summaryStats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '서버 오류 발생', detail: error.message },
      { status: 500 }
    );
  }
}
