import { ApiError, NetworkError } from "./fetcher";

export function getRequestErrorMessage(error: ApiError, fallback: string) {
  if (error instanceof NetworkError) {
    return "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.";
  }
  if (error.status >= 500) {
    return "На сервере произошла ошибка. Попробуйте ещё раз позже.";
  }
  return fallback;
}
