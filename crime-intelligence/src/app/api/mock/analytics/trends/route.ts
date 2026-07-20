import { fail, ok } from "@/server/http/responses";
import { getRepositoryProvider } from "@/data/provider";
export async function GET() { try { return ok(await getRepositoryProvider().dashboard.trends()); } catch (error) { return fail(error); } }
