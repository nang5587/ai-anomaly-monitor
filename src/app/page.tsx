import { redirect } from 'next/navigation';
import { getAuthStatus } from '@/lib/auth'; //🚀 실전용
import { getAuthStatus_mock } from '@/lib/auth';
import HomeClient from '@/components/home/HomeClient';

export default async function HomePage() {
  const user = await getAuthStatus(); //🚀 실전용
  // const user = await getAuthStatus_mock();

  // 5. 인증 상태에 따라 서버에서 즉시 리디렉션 결정
  // if (user) {
  //   if (user.locationId === 0) {
  //     redirect('/supervisor'); // 사용자는 이 페이지 UI를 전혀 보지 못함
  //   } else if (typeof user.locationId === 'number') {
  //     redirect('/admin');
  //   }
  // }

  return <HomeClient />;
}