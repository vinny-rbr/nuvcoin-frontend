type ApiErrorPayload = {
  message?: unknown;
  title?: unknown;
  error?: unknown;
};

function cleanServerText(text: string, fallbackMessage: string): string {
  const trimmed = text.trim();

  if (!trimmed) return fallbackMessage;
  if (trimmed.includes("System.") || trimmed.includes(" at ")) return fallbackMessage;
  if (trimmed.length > 220) return fallbackMessage;

  return trimmed;
}

export async function readApiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = (await response.json()) as ApiErrorPayload;
      const message = data.message ?? data.title ?? data.error;

      if (typeof message === "string") {
        return cleanServerText(message, fallbackMessage);
      }
    }

    const text = await response.text();
    return cleanServerText(text, fallbackMessage);
  } catch {
    return fallbackMessage;
  }
}
