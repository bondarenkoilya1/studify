import { publicEnv } from "@/shared/config";

export function getUTF8Length(string: string): number {
  return new TextEncoder().encode(string).length;
}

export function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${publicEnv.apiBaseUrl}${normalizedPath}`;
}
