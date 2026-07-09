import type { AccusedProfileResponse } from "./types";
import type { UserRole } from "@/lib/permissions";

export class AccusedProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AccusedProfileApiError";
  }
}

export async function fetchAccusedProfile(
  id: string,
  role: UserRole
): Promise<AccusedProfileResponse> {
  const params = new URLSearchParams({ id, role });
  const response = await fetch(`/api/people/accused-profile?${params}`, {
    cache: "no-store",
  });
  const body = (await response.json()) as AccusedProfileResponse & { error?: string };
  if (!response.ok) {
    throw new AccusedProfileApiError(
      body.error ?? "Unable to load accused person profile.",
      response.status
    );
  }
  return body;
}
