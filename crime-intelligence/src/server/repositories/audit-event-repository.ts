import { CatalystRepository } from "@/server/repositories/base";

export type AuditEventRecord = {
  actor_id: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  occurred_at: string;
  outcome: string;
  route?: string;
  previous_state_json?: string;
  new_state_json?: string;
  error_code?: string;
  correlation_id?: string;
};

export class AuditEventRepository extends CatalystRepository<AuditEventRecord> {
  constructor() {
    super("audit_events");
  }
}

export const auditEventRepository = new AuditEventRepository();

