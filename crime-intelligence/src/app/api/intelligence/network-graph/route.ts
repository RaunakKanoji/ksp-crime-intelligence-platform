import { NextResponse } from "next/server";
import { getCriminalNetworkGraph, NetworkGraphValidationError } from "@/lib/criminal-network-graph/service";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { NetworkNodeType, NetworkRelationshipType } from "@/lib/criminal-network-graph/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedRole = params.get("role");
  const role: UserRole = requestedRole && ROLES.includes(requestedRole as UserRole) ? requestedRole as UserRole : "Viewer";
  if (!hasPermission(role, "page:criminal-network-graph")) return NextResponse.json({ error: "Restricted network graph access." }, { status: 403 });
  try {
    return NextResponse.json(await getCriminalNetworkGraph({
      search: params.get("search") ?? undefined, district: params.get("district") ?? undefined,
      nodeTypes: params.get("nodeTypesProvided") === "true" ? params.getAll("nodeType") as NetworkNodeType[] : undefined,
      relationshipTypes: params.get("relationshipTypesProvided") === "true" ? params.getAll("relationshipType") as NetworkRelationshipType[] : undefined,
      maxNodes: Number(params.get("maxNodes") ?? 50),
    }, role));
  } catch (error) {
    if (error instanceof NetworkGraphValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Criminal network graph failed:", error);
    return NextResponse.json({ error: "Unable to load criminal network graph." }, { status: 500 });
  }
}
