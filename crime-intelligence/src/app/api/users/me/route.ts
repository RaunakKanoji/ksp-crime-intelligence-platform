import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/catalyst/auth";
import { configureCatalystForRequest } from "@/server/catalyst/server";
import { toSafeErrorResponse } from "@/server/catalyst/errors";
import {
  ensureCurrentApplicationUser,
  getCurrentApplicationUser,
  updateAllowedProfileFields,
} from "@/server/services/user-service";

export async function GET(request: Request) {
  try {
    configureCatalystForRequest(request);
    const user = await ensureCurrentApplicationUser(request);
    const identity = await getAuthenticatedUser(request);
    const data = await getCurrentApplicationUser({ ...identity, email: user.email });
    return NextResponse.json({ data, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function PATCH(request: Request) {
  try {
    configureCatalystForRequest(request);
    const identity = await getAuthenticatedUser(request);
    const body = await request.json();
    const data = await updateAllowedProfileFields(identity, identity.email ?? identity.id, body);
    return NextResponse.json({ data, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
