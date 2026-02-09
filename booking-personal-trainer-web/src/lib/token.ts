export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

export function setAccessToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function clearAccessToken() {
  localStorage.removeItem("accessToken");
}
