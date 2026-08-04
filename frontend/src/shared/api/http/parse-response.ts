import { transformKeysSnakeToCamel } from "./transform-keys";

export async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    const data = JSON.parse(text);
    // Transform snake_case to camelCase after receiving from backend
    return transformKeysSnakeToCamel(data) as T;
  } catch {
    return text as unknown as T;
  }
}
