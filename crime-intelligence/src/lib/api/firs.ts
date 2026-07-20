export type FirRecord = {
  id: string;
  firNumber: string;
  crimeType: string;
  district: string;
  firDate: string;
  accused: string;
  victim: string;
  description: string;
  createdAt: string | null;
  updatedAt: string | null;
  policeStation?: string;
  reportedDate?: string;
  crimeCategory?: string;
  act?: string;
  section?: string;
  caseStatus?: string;
  sensitiveNote?: string;
};

type FirListResponse = {
  data: FirRecord[];
  nextToken: string | null;
  hasMore: boolean;
};

const FIR_API_PATH = "/server/ksp_crime_app_function/api/firs";

export async function getFirs(nextToken?: string): Promise<FirListResponse> {
  const query = new URLSearchParams({ limit: "25" });

  if (nextToken) {
    query.set("nextToken", nextToken);
  }

  const response = await fetch(`${FIR_API_PATH}?${query}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load FIRs: ${response.status}`);
  }

  return response.json();
}

export async function getAllFirs(maxPages = 20): Promise<FirRecord[]> {
  const rows: FirRecord[] = [];
  let nextToken: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const result = await getFirs(nextToken);
    rows.push(...result.data);
    if (!result.hasMore || !result.nextToken) break;
    nextToken = result.nextToken;
  }

  return rows;
}

export async function createFir(input: Record<string, unknown>): Promise<FirRecord> {
  const response = await fetch(FIR_API_PATH, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to create FIR.");
  }

  return result.data;
}

export async function updateFir(rowId: string, input: Record<string, unknown>): Promise<FirRecord> {
  const response = await fetch(`${FIR_API_PATH}/${rowId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update FIR.");
  }

  return result.data;
}

