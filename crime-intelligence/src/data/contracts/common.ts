export type DataProvider = "mock" | "neon";

export type SortDirection = "asc" | "desc";

export type PageRequest = {
  page?: number;
  pageSize?: number;
};

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: Pagination;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type DateRange = {
  from?: string;
  to?: string;
};

export type SyntheticRecord = {
  isSyntheticData: true;
};
