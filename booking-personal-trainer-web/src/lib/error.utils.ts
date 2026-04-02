/**
 * Extracts error message from API response body.
 * Backend returns { errors: { message: string | string[] } } or { message: string }.
 */
export function getApiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const obj = body as Record<string, unknown>;

  if (typeof obj.message === "string" && obj.message) {
    return obj.message;
  }

  const errors = obj.errors;
  if (errors && typeof errors === "object") {
    const err = errors as Record<string, unknown>;
    const msg = err.message;
    if (typeof msg === "string" && msg) return msg;
    if (Array.isArray(msg) && msg.length > 0) {
      return msg.map(String).join(". ");
    }
  }

  return null;
}

/**
 * Gets display message from a caught error.
 * Uses API message when available, otherwise returns defaultMessage.
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string,
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return defaultMessage;
}
