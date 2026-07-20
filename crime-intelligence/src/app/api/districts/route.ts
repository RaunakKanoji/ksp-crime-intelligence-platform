import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";

export async function GET(request: Request) {
  try { const url = new URL(request.url); return ok(await getRepositoryProvider().districts.findMany({ page: Number(url.searchParams.get("page") ?? 1), pageSize: Number(url.searchParams.get("pageSize") ?? 25), search: url.searchParams.get("search") ?? undefined })); } catch (error) { return fail(error); }
}
