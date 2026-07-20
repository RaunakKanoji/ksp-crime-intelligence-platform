import { CatalystRepository } from "@/server/repositories/base";
import { CATALYST_TABLES } from "@/server/catalyst/tables";

export type CrimeIncidentRecord = {
  ROWID?: string | number;
  incident_id: string;
  fir_number: string;
  title: string;
  description?: string;
  crime_category_id: string;
  district_id: string;
  station_id: string;
  occurred_at: string;
  reported_at?: string;
  status: string;
  severity: string;
  priority: string;
  latitude?: number;
  longitude?: number;
  assigned_officer_id?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  version: number;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
};

export class CrimeIncidentRepository extends CatalystRepository<CrimeIncidentRecord> {
  constructor() {
    super(CATALYST_TABLES.CRIME_INCIDENTS);
  }

  async findByIncidentId(incidentId: string): Promise<CrimeIncidentRecord | null> {
    const result = await this.list({ filters: { incident_id: incidentId, is_deleted: false }, page: 1, pageSize: 1 });
    return result.data[0] ?? null;
  }

  async findByFirNumber(firNumber: string): Promise<CrimeIncidentRecord | null> {
    const result = await this.list({ filters: { fir_number: firNumber, is_deleted: false }, page: 1, pageSize: 1 });
    return result.data[0] ?? null;
  }
}

export const crimeIncidentRepository = new CrimeIncidentRepository();
