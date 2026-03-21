import { cookies, headers } from "next/headers";

// ─── Core fetch helper ──────────────────────────────────────────────────────

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

export async function fetchInternalApi<T>(
  path: string
): Promise<InternalApiResult<T>> {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();

    const host = headerStore.get("host");
    const protocol =
      process.env.NODE_ENV === "development" ? "http" : "https";

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

// ─── Student test types ─────────────────────────────────────────────────────

export type StudentTestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
export type StudentTestStatus = "AVAILABLE" | "UPCOMING" | "LIVE" | "COMPLETED";

export type StudentTestItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  mode: StudentTestMode;
  structureType: "SINGLE" | "SECTIONAL";
  visibilityStatus: string;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes: number | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
    totalQuestions: number;
    durationInMinutes: number | null;
    positiveMarks: number | null;
    negativeMarks: number | null;
  }>;
  _count?: {
    testQuestions: number;
  };
  testBatches?: Array<{
    batchId: string;
    batch: {
      id: string;
      title: string;
      color: string;
    };
  }>;
  studentStatus: StudentTestStatus;
  isGlobal: boolean;
};
export type StudentTestDetailItem = StudentTestItem;

type StudentTestsResponse = {
  items: StudentTestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filteredCount: number;
};

// ─── Student test helpers ───────────────────────────────────────────────────

export async function getStudentTests(params: {
  page?: string;
  limit?: string;
  search?: string;
  mode?: StudentTestMode | "";
  studentStatus?: StudentTestStatus | "";
}): Promise<InternalApiResult<StudentTestsResponse>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.search) searchParams.set("search", params.search);
  if (params.mode) searchParams.set("mode", params.mode);
  if (params.studentStatus) searchParams.set("studentStatus", params.studentStatus);

  return fetchInternalApi<StudentTestsResponse>(
    `/api/student/tests?${searchParams.toString()}`
  );
}

export async function getStudentTestById(
  testId: string
): Promise<InternalApiResult<StudentTestDetailItem>> {
  return fetchInternalApi<StudentTestDetailItem>(`/api/student/tests/${testId}`);
}