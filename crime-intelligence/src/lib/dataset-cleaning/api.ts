import { type CleaningRuleAlias, type ManualReviewItem } from "./types";
import { type UserRole } from "@/lib/permissions";
import { getCleaningRules, addCleaningRule, getManualReviews, resolveManualReviewItem } from "./service";

export async function fetchCleaningRules(role: UserRole): Promise<CleaningRuleAlias[]> {
  const query = new URLSearchParams({ role });
  try {
    const response = await fetch(`/api/datasets/cleaning/rules?${query.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch cleaning rules");
    return (await response.json()) as CleaningRuleAlias[];
  } catch (error) {
    console.warn("API fallback to local cleaning rules:", error);
    return getCleaningRules();
  }
}

export async function saveCleaningRule(
  category: CleaningRuleAlias["category"],
  alias: string,
  canonicalValue: string,
  role: UserRole
): Promise<CleaningRuleAlias> {
  const query = new URLSearchParams({ role });
  try {
    const response = await fetch(`/api/datasets/cleaning/rules?${query.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, alias, canonicalValue }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create rule");
    }
    return (await response.json()) as CleaningRuleAlias;
  } catch (error) {
    console.warn("API fallback to local rules append:", error);
    return addCleaningRule(category, alias, canonicalValue);
  }
}

export async function fetchManualReviews(role: UserRole): Promise<ManualReviewItem[]> {
  const query = new URLSearchParams({ role });
  try {
    const response = await fetch(`/api/datasets/cleaning/manual-reviews?${query.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch manual review items");
    return (await response.json()) as ManualReviewItem[];
  } catch (error) {
    console.warn("API fallback to local manual reviews:", error);
    return getManualReviews();
  }
}

export async function resolveReviewItem(
  id: string,
  correctedValue: string,
  role: UserRole
): Promise<ManualReviewItem> {
  const query = new URLSearchParams({ role });
  try {
    const response = await fetch(`/api/datasets/cleaning/manual-reviews?${query.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, correctedValue }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to resolve item");
    }
    return (await response.json()) as ManualReviewItem;
  } catch (error) {
    console.warn("API fallback to local review resolver:", error);
    const actorEmail = role === "Admin" ? "admin@ksp.gov.in" : `${role.toLowerCase()}@ksp.gov.in`;
    return resolveManualReviewItem(id, correctedValue, actorEmail);
  }
}
