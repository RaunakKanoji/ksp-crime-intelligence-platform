import { fail, ok } from "@/server/http/responses";
import { getDatabaseDashboardOverview } from "@/data/services/dashboard-service";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return ok(await getDatabaseDashboardOverview({ range: params.get("range") as "7d" | "30d" | "90d" | null ?? undefined, district: params.get("district") ?? undefined, category: params.get("category") ?? undefined }));
  } catch (error) {
    return fail(error);
  }
}
