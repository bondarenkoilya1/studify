import { ApiError, NetworkError } from "./fetcher";

export function getRequestErrorMessage(error: ApiError, fallback: string) {
  if (error instanceof NetworkError) {
    return "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.";
  }
  if (error.status === 429) {
    return error.retryAfter
      ? `Слишком много запросов. Попробуйте через ${error.retryAfter} с.`
      : "Слишком много запросов. Попробуйте позже.";
  }
  if (error.status >= 500) {
    return "На сервере произошла ошибка. Попробуйте ещё раз позже.";
  }
  return fallback;
}
