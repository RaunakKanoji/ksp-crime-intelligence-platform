import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { generateReportPreview } from "@/lib/report-builder/service";
import type { ReportConfig, ReportPreviewData } from "@/lib/report-builder/types";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

function pdfSafe(value: unknown): string {
  return String(value ?? "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function fileName(title: string): string {
  const slug = title.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `${slug || "crime_intelligence_report"}.pdf`;
}

function wrapText(text: string, maxLength = 92): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function reportLines(data: ReportPreviewData, activeRole: UserRole): string[] {
  const config = data.config;
  const lines = [
    "KSP Crime Intelligence",
    config.title,
    `Generated: ${new Date(data.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    `Role: ${activeRole}`,
    "",
    "Report Scope",
    `Date range: ${config.startDate} to ${config.endDate}`,
    `District: ${config.district === "all" ? "All districts" : config.district}`,
    `Category: ${config.category === "all" ? "All categories" : config.category}`,
    `Total matching records: ${data.totalCount}`,
    `PII access: ${data.redaction.pii ? "Included for authorized role" : "Redacted"}`,
  ];

  if (config.includeAiSummary && data.aiSummary) {
    lines.push("", "Analytical Summary", ...wrapText(data.aiSummary));
  }

  if (config.includeCharts && data.chartData.length > 0) {
    lines.push("", "Category Breakdown");
    data.chartData.slice(0, 10).forEach((point) => {
      lines.push(`${point.label}: ${point.value}`);
    });
  }

  if (config.includeTables && data.tableData.length > 0) {
    lines.push("", "Case Listing");
    data.tableData.slice(0, 12).forEach((fir) => {
      lines.push(
        `${fir.firNumber} | ${fir.incidentDateTime.slice(0, 10)} | ${fir.policeStation} | ${fir.crimeCategory} | ${fir.caseStatus} | Risk ${fir.riskScore}`
      );
    });
    if (data.tableData.length > 12) lines.push(`Showing 12 of ${data.tableData.length} matching records.`);
  }

  lines.push("", "Audit Notice", ...wrapText(data.auditNote));
  return lines;
}

function buildPdf(data: ReportPreviewData, activeRole: UserRole): Uint8Array {
  const lines = reportLines(data, activeRole).slice(0, 58);
  const contentLines = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    `(${pdfSafe(lines[0])}) Tj`,
    "/F1 13 Tf",
    "0 -28 Td",
    ...lines.slice(1).flatMap((line) => {
      const fontCommand = line && !line.includes(":") && !line.includes("|") && line.length < 32 ? ["/F1 12 Tf"] : ["/F1 10 Tf"];
      return [...fontCommand, `(${pdfSafe(line)}) Tj`, "0 -15 Td"];
    }),
    "ET",
  ];
  const content = contentLines.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return new TextEncoder().encode(pdf);
}

function validateConfig(config: Partial<ReportConfig>): string | null {
  if (!config.title || config.title.trim() === "") return "Report title is required.";
  if (config.range === "custom") {
    if (!config.startDate || !config.endDate) return "Start and end dates are required for custom ranges.";
    if (new Date(config.startDate) > new Date(config.endDate)) return "Start date must be prior to end date.";
  }
  return null;
}

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "feature:export-pdf")) {
    return new NextResponse("Forbidden: insufficient export permissions.", { status: 403 });
  }

  try {
    const config = (await request.json()) as ReportConfig;
    const validationError = validateConfig(config);
    if (validationError) return new NextResponse(`Bad Request: ${validationError}`, { status: 400 });

    const reportData = generateReportPreview(config, activeRole);

    const { logAuditEvent } = require("@/lib/audit-logs/service");
    logAuditEvent(
      activeRole === "Admin" ? "admin@ksp.gov.in" : `${activeRole.toLowerCase()}@ksp.gov.in`,
      "Export PDF",
      "Export",
      "Success",
      `Generated PDF report: "${config.title}" containing ${reportData.tableData.length} records.`
    );

    return new NextResponse(buildPdf(reportData, activeRole), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName(config.title)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF Export API error:", error);
    return new NextResponse("Internal Server Error: failed to export PDF report.", { status: 500 });
  }
}
