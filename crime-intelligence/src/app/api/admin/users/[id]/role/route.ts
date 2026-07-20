import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/catalyst/auth";
import { configureCatalystForRequest } from "@/server/catalyst/server";
import { toSafeErrorResponse } from "@/server/catalyst/errors";
import { assignUserRole, removeUserRole } from "@/server/services/role-service";
import { requireString } from "@/server/validation";

type Context = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, context: Context) {
  try {
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const body = await request.json();
    const roleName = requireString(body?.roleName, "roleName", { min: 2, max: 50 });
    const data = await assignUserRole(actor, decodeURIComponent(context.params.id), roleName);
    return NextResponse.json({ data, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const data = await removeUserRole(actor, decodeURIComponent(context.params.id));
    return NextResponse.json({ data, meta: {}, warnings: [] });
  } catch (error) {
    const response = toSafeErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
