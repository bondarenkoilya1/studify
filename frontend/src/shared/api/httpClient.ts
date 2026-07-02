export async function httpClient<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
