const TOKEN_KEY = "token";
const PERMISSIONS_KEY = "permissions";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getPermissions(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PERMISSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setPermissions(permissions: string[]) {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
}

export function permissionsAreEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
}

type TokenPayload = {
  id: string;
  correo: string;
  role: string;
};

function decodeToken(token: string): TokenPayload | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getCurrentUser(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token);
}
