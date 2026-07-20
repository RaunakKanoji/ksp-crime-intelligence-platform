import { CatalystRepository } from "@/server/repositories/base";

export type RoleRecord = {
  name: string;
  description: string;
  status: string;
  catalyst_role_id?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  version: number;
  is_archived: boolean;
};

export class RoleRepository extends CatalystRepository<RoleRecord> {
  constructor() {
    super("roles");
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    const result = await this.list({ filters: { name, is_archived: false }, page: 1, pageSize: 1 });
    return result.data[0] ?? null;
  }
}

export const roleRepository = new RoleRepository();

