// app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const product = searchParams.get("product");
  const lot = searchParams.get("lot");
  const menu = searchParams.get("menu");
  const type = searchParams.get("type");

  // 여기에 조건에 맞게 필터링 로직 넣어도 됩니다 (예시에서는 고정된 데이터 사용)
  const mock = [
    {
      id: "report_002",
      label: `${product}-${lot} 이상 이벤트 감지 2`,
    },
  ];

  return NextResponse.json(mock);
}
