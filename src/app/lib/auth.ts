export function checkAuth(role: string) {
  const token = typeof window !== 'undefined' && localStorage.getItem("token");
  const userRole = typeof window !== 'undefined' && localStorage.getItem("role");
  return token && userRole === role;
}
