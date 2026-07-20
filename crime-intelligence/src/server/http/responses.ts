import { NextResponse } from "next/server";
import { toSafeErrorResponse } from "@/server/catalyst/errors";

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(error: unknown) {
  const response = toSafeErrorResponse(error);
  return NextResponse.json(
    { success: false, error: response.body.error },
    { status: response.status }
  );
}
