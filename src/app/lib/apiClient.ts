// lib/apiClient.ts
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://10.125.121.172:8080";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  withAuth: boolean = true
): Promise<T> {
  const headers: HeadersInit = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };

  if (withAuth) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 요청 실패 (${res.status}): ${text}`);
  }

  if (res.status === 204) return {} as T; // No Content 대응
  return res.json();
}
