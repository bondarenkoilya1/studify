import { isPlainObject } from "./is-plain-object";

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

export function transformKeysSnakeToCamel(
  obj: unknown,
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysSnakeToCamel(item));
  }

  if (isPlainObject(obj)) {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const camelKey = snakeToCamel(key);
        acc[camelKey] = transformKeysSnakeToCamel(obj[key]);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  return obj;
}

export function transformKeysCamelToSnake(
  obj: unknown,
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysCamelToSnake(item));
  }

  if (isPlainObject(obj)) {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const snakeKey = camelToSnake(key);
        acc[snakeKey] = transformKeysCamelToSnake(obj[key]);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  return obj;
}