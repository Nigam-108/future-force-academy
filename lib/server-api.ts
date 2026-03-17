import { cookies, headers } from "next/headers";

type InternalApiSuccess<T> = {
  success: true;
  status: number;
  message: string;
  data: T;
  errors?: unknown;
};

type InternalApiFailure = {
  success: false;
  status: number;
  message: string;
  data: null;
  errors?: unknown;
};

export type InternalApiResult<T> = InternalApiSuccess<T> | InternalApiFailure;

/**
 * Safer internal API fetch helper for server components.
 *
 * Goals:
 * - forward cookies to protected internal routes
 * - never throw raw fetch/json errors into pages
 * - always return a normalized result shape
 */
export async function fetchInternalApi<T>(
  path: string
): Promise<InternalApiResult<T>> {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();

    const host = headerStore.get("host");
    const protocol =
      process.env.NODE_ENV === "development" ? "http" : "https";

    /**
     * Fallback:
     * Some environments may not provide host as expected.
     */
    if (!host) {
      return {
        success: false,
        status: 500,
        message: "Unable to resolve internal host for server request.",
        data: null,
      };
    }

    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await fetch(`${protocol}://${host}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
      data?: T | null;
      errors?: unknown;
    } | null;

    if (!response.ok || !json?.success) {
      return {
        success: false,
        status: response.status,
        message: json?.message || "Internal API request failed.",
        data: null,
        errors: json?.errors,
      };
    }

    return {
      success: true,
      status: response.status,
      message: json.message || "OK",
      data: (json.data ?? null) as T,
      errors: json.errors,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unexpected internal API error.",
      data: null,
    };
  }
}