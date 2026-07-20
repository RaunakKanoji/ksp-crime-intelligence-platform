import { CatalystRepository } from "@/server/repositories/base";

export type UserProfileRecord = {
  user_id: string;
  rank_title?: string;
  organization_id?: string;
  district_id?: string;
  station_id?: string;
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  version: number;
  is_archived: boolean;
};

export class UserProfileRepository extends CatalystRepository<UserProfileRecord> {
  constructor() {
    super("user_profiles");
  }

  async findByUserId(userId: string): Promise<UserProfileRecord | null> {
    const result = await this.list({ filters: { user_id: userId, is_archived: false }, page: 1, pageSize: 1 });
    return result.data[0] ?? null;
  }
}

export const userProfileRepository = new UserProfileRepository();

