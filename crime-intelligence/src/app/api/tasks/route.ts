import { created, fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";
import { requireObject, requiredString } from "@/data/mock/http";

export async function GET(request: Request) {
  try { const params = new URL(request.url).searchParams; return ok(await getRepositoryProvider().tasks.findMany({ page: Number(params.get("page") ?? 1), pageSize: Number(params.get("pageSize") ?? 25), caseId: params.get("caseId") ?? undefined, officerId: params.get("officerId") ?? undefined, status: params.get("status")?.split(","), overdue: params.get("overdue") === "true" })); } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try { const input = requireObject(await request.json()); return created(await getRepositoryProvider().tasks.create({ caseId: requiredString(input, "caseId"), title: requiredString(input, "title"), description: requiredString(input, "description"), assignedToOfficerId: requiredString(input, "assignedToOfficerId"), assignedByOfficerId: requiredString(input, "assignedByOfficerId"), priority: (input.priority ?? "normal") as never, status: "pending", dueDate: requiredString(input, "dueDate") })); } catch (error) { return fail(error); }
}
