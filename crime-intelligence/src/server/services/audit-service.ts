import type { AuthenticatedUser } from "@/server/catalyst/auth";
import { auditEventRepository, type AuditEventRecord } from "@/server/repositories/audit-event-repository";
import { requirePermission } from "@/server/permissions";
import type { ListOptions, ListResult } from "@/server/catalyst/datastore";

export type AuditEventInput = {
  actor?: Pick<AuthenticatedUser, "id" | "role"> | null;
  action: string;
  entityType: string;
  entityId?: string;
  route?: string;
  outcome?: "success" | "failure";
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  errorCode?: string;
  correlationId?: string;
};

export async function recordAuditEvent(input: AuditEventInput): Promise<AuditEventRecord> {
  return auditEventRepository.insert({
    actor_id: input.actor?.id ?? "anonymous",
    actor_role: input.actor?.role,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    route: input.route,
    outcome: input.outcome ?? "success",
    previous_state_json: sanitizeAuditState(input.previousState),
    new_state_json: sanitizeAuditState(input.newState),
    error_code: input.errorCode,
    correlation_id: input.correlationId,
    occurred_at: new Date().toISOString(),
  });
}

export async function listAuditEvents(
  user: AuthenticatedUser,
  options: ListOptions = { page: 1, pageSize: 50, sortBy: "occurred_at", sortDirection: "desc" },
): Promise<ListResult<AuditEventRecord>> {
  requirePermission(user, "page:admin-settings");
  return auditEventRepository.list(options);
}

function sanitizeAuditState(state?: Record<string, unknown>): string | undefined {
  if (!state) return undefined;
  const blocked = /password|secret|token|apiKey|api_key|privateKey|private_key/i;
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(state)) {
    if (!blocked.test(key)) safe[key] = value;
  }

  return JSON.stringify(safe);
}

