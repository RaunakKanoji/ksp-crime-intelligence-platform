import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/catalyst/auth";
import { configureCatalystForRequest } from "@/server/catalyst/server";
import { toSafeErrorResponse } from "@/server/catalyst/errors";
import { updateAllowedProfileFields } from "@/server/services/user-service";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const body = await request.json();
    const data = await updateAllowedProfileFields(actor, decodeURIComponent(params.id), body);
    return NextResponse.json({ data, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
