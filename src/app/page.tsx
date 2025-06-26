'use client'; // <--- 이 페이지 전체를 클라이언트 컴포넌트로 만듭니다.

import Head from 'next/head';
import { useEffect, useState } from 'react';
import LogisticsMap from '@/components/LogisticsMap'; // @/는 src/를 가리키는 경로 별칭

// Trip 데이터 타입 정의 (컴포넌트 간 공유를 위해 별도 파일로 빼도 좋습니다)
interface Trip {
  product_serial: number;
  waypoints: {
    coordinates: [number, number];
    timestamp: number;
    read_point: string;
    event_type: string;
    product_name: string;
  }[];
}

export default function Home() {
  const [tripData, setTripData] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // public 폴더의 json 파일 가져오기
    fetch('/trips_80000-80100.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('데이터 파일을 불러오는 데 실패했습니다.');
        }
        return res.json();
      })
      .then(data => {
        setTripData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // 컴포넌트가 마운트될 때 한 번만 실행

  return (
    <>
      <Head>
        <title>물류 이동 경로 분석</title>
        <meta name="description" content="실시간 물류 이동 경로 시각화" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        {loading && <div style={{textAlign: 'center', marginTop: '50px'}}>데이터를 불러오는 중입니다...</div>}
        {error && <div style={{textAlign: 'center', marginTop: '50px', color: 'red'}}>오류: {error}</div>}
        {tripData && <LogisticsMap data={tripData} />}
      </main>
    </>
  );
}