import { NextResponse } from "next/server";

export function ok<T>(message: string, data?: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data: data ?? null,
    },
    { status }
  );
}

export function fail(message: string, status = 400, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors: errors ?? null,
      details: errors ?? null,
    },
    { status }
  );
}