import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const roleStr = searchParams.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return new NextResponse("Forbidden: Restricted access to validation logs.", { status: 403 });
  }

  const jobId = params.id;
  let csvString = "Row Number,Column Field,Error Message\n";

  if (jobId === "JOB-002") {
    csvString += '15,Police Station,"Selected boundary Indiranagar PS belongs to Bengaluru City, not Mysuru City."\n';
    csvString += '45,Legal Section,"Invalid IPC section code format IPC-999Z."\n';
  } else if (jobId === "JOB-001") {
    csvString += '2,Risk Score,"Invalid non-numeric risk field high_score."\n';
    csvString += '4,FIR Number,"Duplicate FIR code references found in file rows."\n';
    csvString += '12,District,"Missing required cell value."\n';
    csvString += '12,Police Station,"Missing required cell value."\n';
    csvString += '18,Incident Date/Time,"Invalid timestamp format value."\n';
  } else {
    csvString += "0,None,No structural format warnings detected.\n";
  }

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${jobId}-validation-errors.csv"`,
    },
  });
}
