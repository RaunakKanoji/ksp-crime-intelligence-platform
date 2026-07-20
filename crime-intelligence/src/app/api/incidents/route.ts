import { configureCatalystForRequest } from "@/server/catalyst/server";
import { getAuthenticatedUser } from "@/server/catalyst/auth";
import { created, fail, ok } from "@/server/http/responses";
import { createIncident, listIncidents } from "@/server/services/incident-service";
import { getDataProvider } from "@/data/mock/config";
import { getRepositoryProvider } from "@/data/provider";
import { requiredString, optionalString, requiredNumber, requireObject } from "@/data/mock/http";

export async function GET(request: Request) {
  try {
    if (getDataProvider() === "mock") {
      const params = new URL(request.url).searchParams;
      const result = await getRepositoryProvider().incidents.findMany({ page: Number(params.get("page") ?? 1), pageSize: Number(params.get("pageSize") ?? 25), search: params.get("search") ?? undefined, districtId: params.get("districtId") ?? undefined, stationId: params.get("stationId") ?? undefined, crimeCategoryId: params.get("crimeCategoryId") ?? undefined, status: params.get("status")?.split(","), severity: params.get("severity")?.split(","), priority: params.get("priority")?.split(","), from: params.get("from") ?? undefined, to: params.get("to") ?? undefined });
      return ok(result.data, result.pagination);
    }
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const params = new URL(request.url).searchParams;
    const result = await listIncidents(actor, params);
    return ok(result.data, result.pagination);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    if (getDataProvider() === "mock") {
      const input = requireObject(await request.json());
      return created(await getRepositoryProvider().incidents.create({ title: requiredString(input, "title"), description: optionalString(input, "description", 2000) ?? "Synthetic incident report.", crimeCategoryId: requiredString(input, "crimeCategoryId", 2, 100), reportedAt: typeof input.reportedAt === "string" ? input.reportedAt : new Date().toISOString(), occurredAt: typeof input.occurredAt === "string" ? input.occurredAt : new Date().toISOString(), reportedByType: "system", reportingChannel: "online", stationId: requiredString(input, "stationId", 2, 100), districtId: requiredString(input, "districtId", 2, 100), jurisdictionId: typeof input.jurisdictionId === "string" ? input.jurisdictionId : "JUR-MOCK-DEFAULT", latitude: input.latitude === undefined ? 12.9716 : requiredNumber(input, "latitude", -90, 90), longitude: input.longitude === undefined ? 77.5946 : requiredNumber(input, "longitude", -180, 180), locationName: optionalString(input, "locationName", 180) ?? "Generalized sample location", addressMasked: "Area-level sample address, Karnataka", severity: (input.severity ?? "medium") as never, priority: (input.priority ?? "normal") as never, status: "reported", source: "user", assignedOfficerId: typeof input.assignedOfficerId === "string" ? input.assignedOfficerId : undefined, isSensitive: Boolean(input.isSensitive) }));
    }
    configureCatalystForRequest(request);
    const actor = await getAuthenticatedUser(request);
    const body = await request.json();
    return created(await createIncident(actor, body));
  } catch (error) {
    return fail(error);
  }
}
