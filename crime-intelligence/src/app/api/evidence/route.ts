import { created, fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";
import { requireObject, requiredString } from "@/data/mock/http";

export async function GET(request: Request) {
  try { const params = new URL(request.url).searchParams; return ok(await getRepositoryProvider().evidence.findMany({ page: Number(params.get("page") ?? 1), pageSize: Number(params.get("pageSize") ?? 25), caseId: params.get("caseId") ?? undefined })); } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try { const input = requireObject(await request.json()); const provider = getRepositoryProvider(); const record = await provider.evidence.create({ caseId: requiredString(input, "caseId"), firId: requiredString(input, "firId"), type: requiredString(input, "type") as never, title: requiredString(input, "title"), description: requiredString(input, "description", 1, 1000), collectedAt: requiredString(input, "collectedAt"), collectedByOfficerId: requiredString(input, "collectedByOfficerId"), collectionLocation: requiredString(input, "collectionLocation"), storageLocation: requiredString(input, "storageLocation"), chainOfCustodyStatus: "collected", forensicStatus: "pending", fileReference: `mock://evidence/${Date.now()}`, thumbnailUrl: "/synthetic-evidence-placeholder.svg", sensitivity: "normal", sealed: false }); return created(record); } catch (error) { return fail(error); }
}
