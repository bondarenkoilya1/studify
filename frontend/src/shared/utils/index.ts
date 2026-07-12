export function getUTF8Length(string: string): number {
  return new TextEncoder().encode(string).length;
}
