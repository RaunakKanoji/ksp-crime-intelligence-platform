import { fail, ok } from "@/server/http/responses";
import { developmentOnly } from "@/data/mock/http";
import { assertMockDatabaseValid } from "@/data/mock/validate";
export async function GET() { try { developmentOnly(); return ok(assertMockDatabaseValid()); } catch (error) { return fail(error); } }
