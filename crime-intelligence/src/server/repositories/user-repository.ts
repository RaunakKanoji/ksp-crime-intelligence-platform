import { CatalystRepository } from "@/server/repositories/base";

export type UserRecord = {
  email: string;
  display_name: string;
  status: string;
  role_id?: string;
  district_id?: string;
  station_id?: string;
  phone?: string;
  last_login_at?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  version: number;
  is_archived: boolean;
  development_only?: boolean;
};

export class UserRepository extends CatalystRepository<UserRecord> {
  constructor() {
    super("users");
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.list({ filters: { email, is_archived: false }, page: 1, pageSize: 1 });
    return result.data[0] ?? null;
  }
}

export const userRepository = new UserRepository();

