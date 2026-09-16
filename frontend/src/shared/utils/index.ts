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

export function formatBytes(bytes: number | string, decimals = 1) {
  const size = Number(bytes);
  if (!+size) return "0 Байт";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Байт", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return `${parseFloat((size / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
