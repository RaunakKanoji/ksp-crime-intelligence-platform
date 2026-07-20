import { NextResponse } from "next/server";
import { analyzeModusOperandi, MoAnalysisValidationError } from "@/lib/modus-operandi-analysis/service";
import { hasPermission, type UserRole } from "@/lib/permissions";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedRole = params.get("role");
  const role: UserRole = requestedRole && ROLES.includes(requestedRole as UserRole) ? requestedRole as UserRole : "Viewer";
  if (!hasPermission(role, "page:modus-operandi-analysis")) return NextResponse.json({ error: "Restricted modus-operandi analysis access." }, { status: 403 });
  try {
    return NextResponse.json(await analyzeModusOperandi({
      search: params.get("search") ?? undefined, category: params.get("category") ?? undefined,
      district: params.get("district") ?? undefined, from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined, minimumSimilarity: Number(params.get("minimumSimilarity") ?? 50),
    }, role));
  } catch (error) {
    if (error instanceof MoAnalysisValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Modus-operandi analysis failed:", error);
    return NextResponse.json({ error: "Unable to analyze modus operandi." }, { status: 500 });
  }
}
