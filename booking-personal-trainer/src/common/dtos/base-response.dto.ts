interface PaginationMeta {
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
}

export class BaseResponseDto<T> {
  readonly data: T;
  readonly meta?: PaginationMeta;

  private constructor(data: T, meta?: PaginationMeta) {
    this.data = data;
    this.meta = meta;
  }

  static ok<T>(data: T): BaseResponseDto<T> {
    return new BaseResponseDto(data);
  }

  static okWithPagination<T>(
    data: T,
    pagination: {
      totalItems: number;
      page: number;
      limit: number;
    },
  ): BaseResponseDto<T> {
    const { totalItems, page, limit } = pagination;

    return new BaseResponseDto(data, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }
}
