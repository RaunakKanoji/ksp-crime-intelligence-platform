import { ok, fail } from "@/server/http/responses";
import { developmentOnly } from "@/data/mock/http";
import { getMockDatabase } from "@/data/mock/database";

export async function POST() {
  try { developmentOnly(); return ok(getMockDatabase().reset()); } catch (error) { return fail(error); }
}
