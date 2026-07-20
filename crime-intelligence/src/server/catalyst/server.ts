import "server-only";

import catalyst from "zcatalyst-sdk-node";
import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import { AppError, normalizeCatalystError } from "@/server/catalyst/errors";
import {
  configureCatalystDataStore,
  type CatalystDataStoreAdapter,
  type DataStoreRecord,
  type ListOptions,
  type ListResult,
} from "@/server/catalyst/datastore";

export function getCatalystApp(request: Request): CatalystApp {
  try {
    return catalyst.initialize(request as unknown as Record<string, unknown>);
  } catch (error) {
    throw normalizeCatalystError(error, "Unable to initialize Catalyst for this request.");
  }
}

export function configureCatalystForRequest(request: Request): void {
  configureCatalystDataStore(new CatalystSdkDataStoreAdapter(getCatalystApp(request)));
}

export function getCatalystZcql(request: Request) {
  return getCatalystApp(request).zcql();
}

class CatalystSdkDataStoreAdapter implements CatalystDataStoreAdapter {
  constructor(private readonly app: CatalystApp) {}

  async findById<T extends DataStoreRecord>(table: string, rowId: string): Promise<T | null> {
    try {
      const row = await this.app.datastore().table(table).getRow(rowId);
      return row ? (row as unknown as T) : null;
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw normalizeCatalystError(error, `Unable to read ${table}.`);
    }
  }

  async list<T extends DataStoreRecord>(table: string, options: ListOptions = {}): Promise<ListResult<T>> {
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? 25, 200);
    try {
      const rows = await this.app.datastore().table(table).getPagedRows({ maxRows: pageSize });
      let data = rows.data as unknown as T[];
      data = applyClientSafeFilters(data, options);
      return {
        data,
        pagination: {
          page,
          pageSize,
          total: data.length,
          hasNextPage: rows.more_records === true,
        },
      };
    } catch (error) {
      throw normalizeCatalystError(error, `Unable to list ${table}.`);
    }
  }

  async insert<T extends DataStoreRecord>(table: string, record: DataStoreRecord): Promise<T> {
    try {
      return (await this.app.datastore().table(table).insertRow(record)) as unknown as T;
    } catch (error) {
      throw normalizeCatalystError(error, `Unable to insert ${table}.`);
    }
  }

  async update<T extends DataStoreRecord>(table: string, rowId: string, record: DataStoreRecord): Promise<T> {
    try {
      return (await this.app.datastore().table(table).updateRow({ ...record, ROWID: rowId })) as unknown as T;
    } catch (error) {
      throw normalizeCatalystError(error, `Unable to update ${table}.`);
    }
  }

  async delete(table: string, rowId: string): Promise<boolean> {
    try {
      return await this.app.datastore().table(table).deleteRow(rowId);
    } catch (error) {
      throw normalizeCatalystError(error, `Unable to delete ${table}.`);
    }
  }
}

function applyClientSafeFilters<T extends DataStoreRecord>(rows: T[], options: ListOptions): T[] {
  const filters = options.filters ?? {};
  let data = rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => value === undefined || value === "" || row[key] === value)
  );

  if (options.sortBy) {
    const direction = options.sortDirection === "desc" ? -1 : 1;
    data = [...data].sort((a, b) => String(a[options.sortBy!] ?? "").localeCompare(String(b[options.sortBy!] ?? "")) * direction);
  }

  return data;
}

function isNotFoundError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : JSON.stringify(error);
  return /not.?found|no.?data|invalid row/i.test(text);
}

export function requireRowId(row: DataStoreRecord): string {
  const rowId = row.ROWID;
  if (typeof rowId === "string" || typeof rowId === "number") return String(rowId);
  throw new AppError("DATABASE_OPERATION_FAILED", "Catalyst row did not include ROWID.", { status: 500 });
}
