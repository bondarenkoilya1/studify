import type { ReactNode } from "react";

/**
 * Extracts initials from an email, full name, or text string.
 * If fallback is already a ReactNode (e.g. icon or JSX), it is returned as is.
 */
export function getInitials(fallback: ReactNode): ReactNode {
  if (typeof fallback !== "string") {
    return fallback;
  }

  const clean = fallback.trim();
  if (!clean) return null;

  // If email (e.g. "alex.smith@example.com")
  if (clean.includes("@")) {
    const atIndex = clean.indexOf("@");
    const localPart = atIndex > 0 ? clean.slice(0, atIndex) : clean;
    const parts = localPart.split(/[._-]/).filter(Boolean);
    const first = parts[0];
    const second = parts[1];
    if (first && second && first[0] && second[0]) {
      return (first[0] + second[0]).toUpperCase();
    }
    return localPart.slice(0, 2).toUpperCase();
  }

  // If full name (e.g. "Иван Иванов" or "John Doe")
  const words = clean.split(/\s+/).filter(Boolean);
  const firstWord = words[0];
  const secondWord = words[1];
  if (firstWord && secondWord && firstWord[0] && secondWord[0]) {
    return (firstWord[0] + secondWord[0]).toUpperCase();
  }

  return clean.slice(0, 2).toUpperCase();
}

/**
 * Validates a File against standard file input `accept` patterns (e.g. "image/*", "image/png, image/jpeg", ".png, .jpg")
 */
export function isFileAccepted(file: File, accept?: string): boolean {
  if (!accept || accept.trim() === "" || accept === "*") {
    return true;
  }

  const acceptedTypes = accept
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return acceptedTypes.some((pattern) => {
    // Wildcard MIME: e.g. "image/*"
    if (pattern.endsWith("/*")) {
      const baseType = pattern.slice(0, -2);
      return fileType.startsWith(baseType + "/");
    }

    // Extension: e.g. ".png"
    if (pattern.startsWith(".")) {
      return fileName.endsWith(pattern);
    }

    // Exact MIME: e.g. "image/png"
    return fileType === pattern;
  });
}
