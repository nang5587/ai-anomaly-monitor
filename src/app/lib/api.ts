// lib/api.ts

export async function fetchLogin(userId: string, password: string) {
  const res = await fetch('http://10.125.121.172:8080/api/public/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }), 
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`로그인 실패 (${res.status}): ${text}`);
  }

  return res;
}
