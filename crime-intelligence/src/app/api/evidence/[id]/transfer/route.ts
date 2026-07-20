import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";
import { requireObject, requiredString } from "@/data/mock/http";
export async function POST(request: Request, { params }: { params: { id: string } }) { try { const input = requireObject(await request.json()); return ok(await getRepositoryProvider().evidence.transfer(params.id, { toOfficerId: typeof input.toOfficerId === "string" ? input.toOfficerId : undefined, location: requiredString(input, "location"), remarks: requiredString(input, "remarks"), action: requiredString(input, "action") as never })); } catch (error) { return fail(error); } }
