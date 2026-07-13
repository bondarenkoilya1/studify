export async function httpClient<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
