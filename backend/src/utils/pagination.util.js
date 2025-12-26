/**
 * Pagination Utilities
 * Provides efficient pagination strategies
 * 
 * Trade-offs:
 * - Offset-based (skip/limit): Simple, but slow for large offsets
 * - Cursor-based: Fast, but more complex, requires cursor management
 */

/**
 * Offset-based pagination (traditional)
 * Use for: Small datasets, random access, user-friendly page numbers
 * 
 * Performance: O(n) where n is the offset
 * Best for: < 10,000 records, page numbers in UI
 */
export const offsetPagination = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    limit: limitNum,
    page: pageNum,
  };
};

/**
 * Cursor-based pagination (for large datasets)
 * Use for: Large datasets, infinite scroll, better performance
 * 
 * Performance: O(log n) with index on cursor field
 * Best for: > 10,000 records, social feeds, real-time data
 */
export const cursorPagination = (cursor = null, limit = 20, sortField = '_id') => {
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  return {
    cursor,
    limit: limitNum,
    sortField,
  };
};

/**
 * Build cursor query for MongoDB
 */
export const buildCursorQuery = (cursor, sortField = '_id', sortDirection = -1) => {
  if (!cursor) {
    return {};
  }

  // Parse cursor (should be base64 encoded JSON)
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
    const operator = sortDirection === -1 ? '$lt' : '$gt';
    return {
      [sortField]: { [operator]: decoded[sortField] },
    };
  } catch (error) {
    // Invalid cursor, return empty query (start from beginning)
    return {};
  }
};

/**
 * Generate next cursor from document
 */
export const generateCursor = (doc, sortField = '_id') => {
  if (!doc || !doc[sortField]) {
    return null;
  }

  const cursorData = {
    [sortField]: doc[sortField],
  };

  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
};

/**
 * Optimized count query (estimated count for large collections)
 * 
 * Trade-off: Estimated count is faster but less accurate
 * Use estimated for: Large collections (> 100k documents)
 */
export const getCount = async (Model, filter, useEstimated = false) => {
  if (useEstimated) {
    // Estimated count is much faster for large collections
    const stats = await Model.collection.estimatedDocumentCount();
    return stats;
  }

  // Exact count (slower but accurate)
  return await Model.countDocuments(filter);
};

/**
 * Pagination response formatter
 */
export const formatPaginationResponse = (data, pagination, cursor = null) => {
  const response = {
    data,
    pagination: {
      ...pagination,
      hasNext: data.length === pagination.limit,
      hasPrev: pagination.page > 1,
    },
  };

  if (cursor !== null) {
    response.pagination.cursor = cursor;
  }

  return response;
};

/**
 * Hybrid pagination: Use cursor for large offsets, offset for small
 * 
 * Trade-off: More complex but optimal performance
 */
export const hybridPagination = async (query, page, limit, threshold = 1000) => {
  const { skip, limit: limitNum, page: pageNum } = offsetPagination(page, limit);

  // Use cursor-based if offset is large
  if (skip > threshold) {
    // For large offsets, use cursor-based approach
    // This requires knowing the cursor from a previous query
    // In practice, you'd store cursors or use a different strategy
    return {
      strategy: 'cursor',
      ...cursorPagination(null, limitNum),
    };
  }

  // Use offset-based for small offsets
  return {
    strategy: 'offset',
    skip,
    limit: limitNum,
    page: pageNum,
  };
};

export default {
  offsetPagination,
  cursorPagination,
  buildCursorQuery,
  generateCursor,
  getCount,
  formatPaginationResponse,
  hybridPagination,
};



