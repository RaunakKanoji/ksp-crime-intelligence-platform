import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";

export async function GET(request: Request) {
  try { const params = new URL(request.url).searchParams; return ok(await getRepositoryProvider().officers.findMany({ page: Number(params.get("page") ?? 1), pageSize: Number(params.get("pageSize") ?? 25), search: params.get("search") ?? undefined, districtId: params.get("districtId") ?? undefined, stationId: params.get("stationId") ?? undefined, status: params.get("status") ?? undefined })); } catch (error) { return fail(error); }
}
