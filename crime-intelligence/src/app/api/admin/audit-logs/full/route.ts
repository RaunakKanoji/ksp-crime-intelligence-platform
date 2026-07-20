import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/catalyst/auth";
import { configureCatalystForRequest } from "@/server/catalyst/server";
import { toSafeErrorResponse } from "@/server/catalyst/errors";
import { listAuditEvents } from "@/server/services/audit-service";
import { parsePagination } from "@/server/validation";

export async function GET(request: Request) {
  try {
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const params = new URL(request.url).searchParams;
    const data = await listAuditEvents(actor, {
      ...parsePagination(params, 500),
      filters: {
        action: params.get("action") || undefined,
        entity_type: params.get("entityType") || undefined,
        outcome: params.get("outcome") || undefined,
      },
      sortBy: params.get("sortBy") ?? "occurred_at",
      sortDirection: params.get("sortDirection") === "asc" ? "asc" : "desc",
    });
    return NextResponse.json({ data: data.data, pagination: data.pagination, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
