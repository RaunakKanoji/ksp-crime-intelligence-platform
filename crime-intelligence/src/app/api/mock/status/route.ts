import { ok, fail } from "@/server/http/responses";
import { getMockDatabase } from "@/data/mock/database";

export async function GET() {
  try { return ok(getMockDatabase().status()); } catch (error) { return fail(error); }
}
