import type { PaginatedResponse } from "@pk-literature/contracts";
import type { PaginationDto } from "./pagination.dto";

export function paginate<T>(
  items: T[],
  totalItems: number,
  pagination: PaginationDto,
): PaginatedResponse<T> {
  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pagination.pageSize),
  };
}
