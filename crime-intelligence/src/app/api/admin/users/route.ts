import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/catalyst/auth";
import { configureCatalystForRequest } from "@/server/catalyst/server";
import { toSafeErrorResponse } from "@/server/catalyst/errors";
import { listUsers, updateAllowedProfileFields } from "@/server/services/user-service";
import { parsePagination, requireString } from "@/server/validation";

export async function GET(request: Request) {
  try {
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const params = new URL(request.url).searchParams;
    const data = await listUsers(actor, {
      ...parsePagination(params),
      sortBy: params.get("sortBy") ?? "display_name",
      sortDirection: params.get("sortDirection") === "desc" ? "desc" : "asc",
    });
    return NextResponse.json({ data: data.data, pagination: data.pagination, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function PATCH(request: Request) {
  try {
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const body = await request.json();
    const userId = requireString(body?.userId, "userId", { min: 3, max: 254 });
    const data = await updateAllowedProfileFields(actor, userId, body);
    return NextResponse.json({ data, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
