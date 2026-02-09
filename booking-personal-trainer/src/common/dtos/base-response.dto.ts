interface PaginationMeta {
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
}

export class BaseResponse<T> {
  readonly data: T;
  readonly meta?: PaginationMeta;

  private constructor(data: T, meta?: PaginationMeta) {
    this.data = data;
    this.meta = meta;
  }

  static ok<T>(data: T): BaseResponse<T> {
    return new BaseResponse(data);
  }

  static okWithPagination<T>(
    data: T,
    pagination: {
      totalItems: number;
      page: number;
      limit: number;
    },
  ): BaseResponse<T> {
    const { totalItems, page, limit } = pagination;

    return new BaseResponse(data, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }
}
