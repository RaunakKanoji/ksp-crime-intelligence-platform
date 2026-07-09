import type { UserRole } from "@/lib/permissions";
import type { VictimProfileResponse } from "./types";

export class VictimProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "VictimProfileApiError";
  }
}

export async function fetchVictimProfile(
  id: string,
  role: UserRole
): Promise<VictimProfileResponse> {
  const params = new URLSearchParams({ id, role });
  const response = await fetch(`/api/people/victim-profile?${params}`, {
    cache: "no-store",
  });
  const body = (await response.json()) as VictimProfileResponse & { error?: string };
  if (!response.ok) {
    throw new VictimProfileApiError(
      body.error ?? "Unable to load victim profile summary.",
      response.status
    );
  }
  return body;
}
