export function paginate(page: number, limit: number) {
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function paginatedResult<T>(items: T[], total: number, page: number, limit: number) {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
