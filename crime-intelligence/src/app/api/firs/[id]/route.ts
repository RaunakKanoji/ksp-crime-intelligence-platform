import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";
import { requireObject, optionalString } from "@/data/mock/http";
export async function GET(_request: Request, { params }: { params: { id: string } }) { try { return ok(await getRepositoryProvider().firs.findById(params.id)); } catch (error) { return fail(error); } }
export async function PATCH(request: Request, { params }: { params: { id: string } }) { try { const input = requireObject(await request.json()); return ok(await getRepositoryProvider().firs.update(params.id, { status: input.status as never, priority: input.priority as never, summary: optionalString(input, "summary", 2000), investigatingOfficerId: optionalString(input, "investigatingOfficerId"), chargeSheetStatus: input.chargeSheetStatus as never, chargeSheetDate: optionalString(input, "chargeSheetDate"), closureReason: optionalString(input, "closureReason", 1000) })); } catch (error) { return fail(error); } }
