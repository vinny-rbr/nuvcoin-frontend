const rawApiUrl = import.meta.env.VITE_API_URL?.trim() ?? "";

export const API_ORIGIN = rawApiUrl.replace(/\/+$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_ORIGIN) {
    return normalizedPath;
  }

  return `${API_ORIGIN}${normalizedPath}`;
}
