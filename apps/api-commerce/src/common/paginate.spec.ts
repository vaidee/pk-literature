import { paginate } from "./paginate";
import type { PaginationDto } from "./pagination.dto";

describe("paginate", () => {
  it("computes totalPages by ceiling division", () => {
    const pagination = { page: 2, pageSize: 10 } as PaginationDto;
    const result = paginate(["a", "b", "c"], 23, pagination);

    expect(result).toEqual({
      items: ["a", "b", "c"],
      page: 2,
      pageSize: 10,
      totalItems: 23,
      totalPages: 3,
    });
  });

  it("returns zero totalPages for an empty result set", () => {
    const pagination = { page: 1, pageSize: 20 } as PaginationDto;
    const result = paginate([], 0, pagination);

    expect(result.totalPages).toBe(0);
  });
});
