import { CatalystRepository } from "@/server/repositories/base";

export type UserRoleAssignmentRecord = {
  assignment_key: string;
  user_id: string;
  role_id: string;
  status: string;
  assigned_at: string;
  assigned_by: string;
  removed_at?: string;
  removed_by?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  version: number;
  is_archived: boolean;
};

export class UserRoleRepository extends CatalystRepository<UserRoleAssignmentRecord> {
  constructor() {
    super("user_role_assignments");
  }

  async findActiveByUserId(userId: string): Promise<UserRoleAssignmentRecord | null> {
    const result = await this.list({
      filters: { user_id: userId, status: "active", is_archived: false },
      page: 1,
      pageSize: 1,
    });
    return result.data[0] ?? null;
  }
}

export const userRoleRepository = new UserRoleRepository();

