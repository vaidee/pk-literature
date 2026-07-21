// Shared pagination envelope for every list endpoint across every
// domain API — one shape, not reinvented per service.

export interface PaginationQuery {
  /** 1-indexed page number. Defaults to 1. */
  page?: number;
  /** Items per page. Defaults to 20, capped at 100 (see api-catalog's PaginationDto). */
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
