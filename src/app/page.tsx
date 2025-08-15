import { redirect } from 'next/navigation';
import { getAuthStatus } from '@/lib/auth';
import { getAuthStatus_mock } from '@/lib/auth';
import HomeClient from '@/components/home/HomeClient';

export default async function HomePage() {
  const user = await getAuthStatus();
  return <HomeClient />;
}