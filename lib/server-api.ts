import { cookies, headers } from "next/headers";

export type InternalApiResponse<T = unknown> = {
  success: boolean;
  data: T | null;
  message: string;
  errors?: unknown;
  status: number;
};

export type StudentTestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
export type StudentTestStructureType = "SINGLE" | "SECTIONAL";
export type StudentTestVisibilityStatus = "DRAFT" | "LIVE" | "CLOSED";
export type StudentTestStatus = "AVAILABLE" | "UPCOMING" | "LIVE" | "COMPLETED";

export type StudentTestSection = {
  id: string;
  title: string;
  displayOrder: number;
  totalQuestions: number;
  durationInMinutes: number | null;
  positiveMarks: number | null;
  negativeMarks: number | null;
};

export type StudentTestItem = {
  id: string;
  createdById: string | null;
  title: string;
  slug: string;
  description: string | null;
  mode: StudentTestMode;
  structureType: StudentTestStructureType;
  visibilityStatus: StudentTestVisibilityStatus;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes: number | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: StudentTestSection[];
  _count: {
    testQuestions: number;
    attempts: number;
  };
  studentStatus: StudentTestStatus;
};

export type StudentTestsListData = {
  items: StudentTestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filteredCount?: number;
};

export type StudentTestsQuery = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  mode?: StudentTestMode | "";
  studentStatus?: StudentTestStatus | "";
};

function toCookieHeader(
  allCookies: Awaited<ReturnType<typeof cookies>> extends infer CookieStore
    ? CookieStore
    : never
) {
  return allCookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function getBaseUrl() {
  const envBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function buildQueryString(query: StudentTestsQuery) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function fetchInternalApi<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<InternalApiResponse<T>> {
  try {
    const baseUrl = await getBaseUrl();
    const cookieStore = await cookies();
    const cookieHeader = toCookieHeader(cookieStore);

    const requestHeaders = new Headers(init.headers);

    if (cookieHeader && !requestHeaders.has("Cookie")) {
      requestHeaders.set("Cookie", cookieHeader);
    }

    if (!requestHeaders.has("Accept")) {
      requestHeaders.set("Accept", "application/json");
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: requestHeaders,
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as
      | {
          success?: boolean;
          data?: T | null;
          message?: string;
          errors?: unknown;
        }
      | null;

    return {
      success: Boolean(json?.success),
      data: (json?.data ?? null) as T | null,
      message: json?.message ?? "Unknown response",
      errors: json?.errors,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Failed to contact internal API.",
      status: 500,
    };
  }
}

export async function getStudentTests(
  query: StudentTestsQuery = {}
): Promise<InternalApiResponse<StudentTestsListData>> {
  return fetchInternalApi<StudentTestsListData>(
    `/api/student/tests${buildQueryString(query)}`
  );
}

export async function getStudentTestById(
  testId: string
): Promise<InternalApiResponse<StudentTestItem>> {
  const limit = 100;
  let page = 1;

  while (true) {
    const response = await getStudentTests({ page, limit });

    if (!response.success || !response.data) {
      return {
        success: false,
        data: null,
        message: response.message || "Failed to load test details.",
        errors: response.errors,
        status: response.status,
      };
    }

    const match = response.data.items.find((item) => item.id === testId);

    if (match) {
      return {
        success: true,
        data: match,
        message: "Test fetched successfully.",
        status: 200,
      };
    }

    if (page >= response.data.totalPages) {
      break;
    }

    page += 1;
  }

  return {
    success: false,
    data: null,
    message: "Test not found.",
    status: 404,
  };
}