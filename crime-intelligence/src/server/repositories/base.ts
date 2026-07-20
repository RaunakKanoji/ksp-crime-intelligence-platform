import {
  getCatalystDataStore,
  type DataStoreRecord,
  type ListOptions,
  type ListResult,
} from "@/server/catalyst/datastore";

export class CatalystRepository<T extends DataStoreRecord> {
  constructor(readonly tableName: string) {}

  findById(id: string): Promise<T | null> {
    return getCatalystDataStore().findById<T>(this.tableName, id);
  }

  list(options?: ListOptions): Promise<ListResult<T>> {
    return getCatalystDataStore().list<T>(this.tableName, options);
  }

  insert(record: DataStoreRecord): Promise<T> {
    return getCatalystDataStore().insert<T>(this.tableName, record);
  }

  update(id: string, record: DataStoreRecord): Promise<T> {
    return getCatalystDataStore().update<T>(this.tableName, id, record);
  }

  delete(id: string): Promise<boolean> {
    return getCatalystDataStore().delete(this.tableName, id);
  }
}
