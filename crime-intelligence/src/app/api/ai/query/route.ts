import { NextResponse } from "next/server";
import { interpretQueryWithGemini } from "@/lib/ai/gemini";
import { runNaturalLanguageQuery } from "@/lib/ai/natural-language-query";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from "@/lib/ai/types";
import { hasPermission, type UserRole } from "@/lib/permissions";

interface AiQueryBody {
  prompt?: unknown;
  role?: unknown;
}

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

function safeRole(value: unknown): UserRole {
  return typeof value === "string" && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

export async function POST(request: Request) {
  let body: AiQueryBody;
  try {
    body = (await request.json()) as AiQueryBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const role = safeRole(body.role);

  if (!hasPermission(role, "page:ai-query")) {
    const response = await runNaturalLanguageQuery({ prompt, role });
    return NextResponse.json(response, { status: 403 });
  }

  if (prompt.length < MIN_QUERY_LENGTH || prompt.length > MAX_QUERY_LENGTH) {
    const response = await runNaturalLanguageQuery({ prompt, role });
    return NextResponse.json(response, { status: 200 });
  }

  try {
    const gemini = await interpretQueryWithGemini(prompt);
    if (gemini) {
      const response = await runNaturalLanguageQuery({
        prompt,
        role,
        interpretationOverride: gemini.interpretation,
        provider: "gemini",
        providerNote: gemini.providerNote,
        providerConfidence: gemini.confidence,
      });
      return NextResponse.json(response);
    }
  } catch (err) {
    console.error("Gemini NLP interpretation failed:", err);
  }

  const fallback = await runNaturalLanguageQuery({
    prompt,
    role,
    provider: "deterministic",
    providerNote:
      "Gemini NLP is not configured or was unavailable. The app used the local deterministic interpreter instead.",
  });
  return NextResponse.json(fallback);
}
