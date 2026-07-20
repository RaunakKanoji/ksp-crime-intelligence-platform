import { configureCatalystForRequest } from "@/server/catalyst/server";
import { getAuthenticatedUser } from "@/server/catalyst/auth";
import { fail, noContent, ok } from "@/server/http/responses";
import { deleteIncident, getIncident, updateIncident } from "@/server/services/incident-service";
import { getDataProvider } from "@/data/mock/config";
import { getRepositoryProvider } from "@/data/provider";
import { requireObject } from "@/data/mock/http";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (getDataProvider() === "mock") return ok(await getRepositoryProvider().incidents.findById(decodeURIComponent(params.id)));
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    return ok(await getIncident(actor, decodeURIComponent(params.id)));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (getDataProvider() === "mock") {
      const input = requireObject(await request.json());
      return ok(await getRepositoryProvider().incidents.update(decodeURIComponent(params.id), { title: typeof input.title === "string" ? input.title : undefined, description: typeof input.description === "string" ? input.description : undefined, crimeCategoryId: typeof input.crimeCategoryId === "string" ? input.crimeCategoryId : undefined, occurredAt: typeof input.occurredAt === "string" ? input.occurredAt : undefined, reportedAt: typeof input.reportedAt === "string" ? input.reportedAt : undefined, stationId: typeof input.stationId === "string" ? input.stationId : undefined, districtId: typeof input.districtId === "string" ? input.districtId : undefined, latitude: typeof input.latitude === "number" ? input.latitude : undefined, longitude: typeof input.longitude === "number" ? input.longitude : undefined, locationName: typeof input.locationName === "string" ? input.locationName : undefined, severity: input.severity as never, priority: input.priority as never, status: input.status as never, assignedOfficerId: typeof input.assignedOfficerId === "string" ? input.assignedOfficerId : undefined }));
    }
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const body = await request.json();
    return ok(await updateIncident(actor, decodeURIComponent(params.id), body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (getDataProvider() === "mock") { await getRepositoryProvider().incidents.delete(decodeURIComponent(params.id)); return noContent(); }
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    await deleteIncident(actor, decodeURIComponent(params.id));
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
