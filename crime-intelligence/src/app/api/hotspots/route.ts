import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";

export async function GET(request: Request) {
  try { const params = new URL(request.url).searchParams; return ok(await getRepositoryProvider().hotspots.findMany({ page: Number(params.get("page") ?? 1), pageSize: Number(params.get("pageSize") ?? 100), districtId: params.get("districtId") ?? undefined, stationId: params.get("stationId") ?? undefined, crimeCategoryId: params.get("crimeCategoryId") ?? undefined })); } catch (error) { return fail(error); }
}
