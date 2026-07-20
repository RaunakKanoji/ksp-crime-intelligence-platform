import { CatalystRepository } from "@/server/repositories/base";
import { CATALYST_TABLES } from "@/server/catalyst/tables";

export type DistrictRecord = {
  ROWID?: string | number;
  district_id: string;
  name: string;
  status: string;
  is_deleted: boolean;
};

export type PoliceStationRecord = {
  ROWID?: string | number;
  station_id: string;
  district_id: string;
  name: string;
  status: string;
  is_deleted: boolean;
};

export type OfficerRecord = {
  ROWID?: string | number;
  officer_id: string;
  display_name: string;
  district_id?: string;
  station_id?: string;
  status: string;
  is_deleted: boolean;
};

export type CrimeCategoryRecord = {
  ROWID?: string | number;
  category_id: string;
  name: string;
  status: string;
  is_deleted: boolean;
};

export const districtRepository = new CatalystRepository<DistrictRecord>(CATALYST_TABLES.DISTRICTS);
export const policeStationRepository = new CatalystRepository<PoliceStationRecord>(CATALYST_TABLES.POLICE_STATIONS);
export const officerRepository = new CatalystRepository<OfficerRecord>(CATALYST_TABLES.OFFICERS);
export const crimeCategoryRepository = new CatalystRepository<CrimeCategoryRecord>(CATALYST_TABLES.CRIME_CATEGORIES);
