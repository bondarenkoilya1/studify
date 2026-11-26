import { ApiError, NetworkError } from "./fetcher";

export function getRequestErrorMessage(
  error: unknown,
  fallback: string,
  messages: {
    invalid?: string;
    missing?: string;
    conflict?: string;
    tooLarge?: string;
    unsupported?: string;
  } = {},
) {
  if (error instanceof NetworkError) {
    return "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.";
  }
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 429) {
    return error.retryAfter
      ? `Слишком много запросов. Попробуйте через ${error.retryAfter} с.`
      : "Слишком много запросов. Попробуйте позже.";
  }
  if (error.status >= 500) {
    return "На сервере произошла ошибка. Попробуйте ещё раз позже.";
  }
  switch (error.status) {
    case 400:
    case 422:
      return messages.invalid ?? fallback;
    case 404:
      return messages.missing ?? "Запись больше недоступна. Обновите страницу.";
    case 409:
      return messages.conflict ?? fallback;
    case 413:
      return messages.tooLarge ?? "Превышен допустимый размер.";
    case 415:
      return messages.unsupported ?? fallback;
    default:
      return fallback;
  }
}
