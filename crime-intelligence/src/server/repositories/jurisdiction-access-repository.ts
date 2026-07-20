import { CatalystRepository } from "@/server/repositories/base";

export type JurisdictionAccessRecord = {
  access_key: string;
  user_id: string;
  organization_id?: string;
  district_id?: string;
  station_id?: string;
  access_level: string;
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  version: number;
  is_archived: boolean;
  archived_at?: string;
  archived_by?: string;
};

export class JurisdictionAccessRepository extends CatalystRepository<JurisdictionAccessRecord> {
  constructor() {
    super("jurisdiction_access");
  }

  async listActiveByUserId(userId: string): Promise<JurisdictionAccessRecord[]> {
    const result = await this.list({
      filters: { user_id: userId, status: "active", is_archived: false },
      page: 1,
      pageSize: 100,
    });
    return result.data;
  }
}

export const jurisdictionAccessRepository = new JurisdictionAccessRepository();

