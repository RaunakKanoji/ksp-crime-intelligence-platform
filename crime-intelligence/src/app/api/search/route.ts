import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";
import { AppError } from "@/server/catalyst/errors";

export async function GET(request: Request) {
  try { const params = new URL(request.url).searchParams; const query = params.get("q")?.trim(); if (!query) throw new AppError("VALIDATION_FAILED", "Search query is required."); return ok(await getRepositoryProvider().search.search(query, Number(params.get("limit") ?? 8))); } catch (error) { return fail(error); }
}
