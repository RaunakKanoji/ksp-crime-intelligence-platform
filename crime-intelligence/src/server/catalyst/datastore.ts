import { AppError } from "@/server/catalyst/errors";

export type DataStoreRecord = Record<string, unknown>;

export type ListOptions = {
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type ListResult<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
  };
};

export interface CatalystDataStoreAdapter {
  findById<T extends DataStoreRecord>(table: string, id: string): Promise<T | null>;
  list<T extends DataStoreRecord>(table: string, options?: ListOptions): Promise<ListResult<T>>;
  insert<T extends DataStoreRecord>(table: string, record: DataStoreRecord): Promise<T>;
  update<T extends DataStoreRecord>(table: string, id: string, record: DataStoreRecord): Promise<T>;
  delete(table: string, id: string): Promise<boolean>;
}

let adapter: CatalystDataStoreAdapter | null = null;

export function configureCatalystDataStore(nextAdapter: CatalystDataStoreAdapter): void {
  adapter = nextAdapter;
}

export function getCatalystDataStore(): CatalystDataStoreAdapter {
  if (!adapter) {
    throw new AppError(
      "DATABASE_UNAVAILABLE",
      "Catalyst Data Store is not configured for this environment.",
    );
  }

  return adapter;
}
