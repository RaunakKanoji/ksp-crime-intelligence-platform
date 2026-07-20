import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";
import { requireObject, optionalString } from "@/data/mock/http";
export async function PATCH(request: Request, { params }: { params: { id: string } }) { try { const input = requireObject(await request.json()); return ok(await getRepositoryProvider().tasks.update(params.id, { status: input.status as never, priority: input.priority as never, dueDate: optionalString(input, "dueDate"), assignedToOfficerId: optionalString(input, "assignedToOfficerId"), description: optionalString(input, "description", 1000), title: optionalString(input, "title") })); } catch (error) { return fail(error); } }
