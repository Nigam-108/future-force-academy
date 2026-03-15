import { cookies } from "next/headers";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function fetchInternalApi<T>(path: string): Promise<{
  success: boolean;
  data: T | null;
  message: string;
}> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  const json = await response.json();

  return {
    success: Boolean(json?.success),
    data: (json?.data ?? null) as T | null,
    message: json?.message ?? "Unknown response",
  };
}