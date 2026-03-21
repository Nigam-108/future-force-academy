/**
 * Safely parses a fetch response.
 * If the response is HTML (server error page) instead of JSON,
 * returns a standard failure object instead of throwing.
 */
export async function safeJson<T>(
  response: Response
): Promise<{ success: boolean; message: string; data?: T }> {
  const contentType = response.headers.get("content-type") ?? "";

  // If the server returned HTML instead of JSON (e.g. Next.js error page)
  if (!contentType.includes("application/json")) {
    return {
      success: false,
      message: `Server error (${response.status}) — please check the terminal for details`,
    };
  }

  try {
    return (await response.json()) as {
      success: boolean;
      message: string;
      data?: T;
    };
  } catch {
    return {
      success: false,
      message: "Failed to parse server response",
    };
  }
}