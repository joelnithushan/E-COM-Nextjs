import mongoose from 'mongoose';

/**
 * Sanitize MongoDB ObjectId
 * @param {String} id - ObjectId string
 * @returns {String|null} Valid ObjectId or null
 */
export const sanitizeObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    return null;
  }

  // Check if it's a valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return id;
};

/**
 * Sanitize array of ObjectIds
 * @param {Array} ids - Array of ObjectId strings
 * @returns {Array} Array of valid ObjectIds
 */
export const sanitizeObjectIdArray = (ids) => {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids
    .map((id) => sanitizeObjectId(id))
    .filter((id) => id !== null);
};

/**
 * Sanitize query parameters for MongoDB
 * Prevents NoSQL injection by validating and sanitizing inputs
 * @param {Object} query - Query object
 * @returns {Object} Sanitized query
 */
export const sanitizeQuery = (query) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    // Skip dangerous MongoDB operators in keys
    if (key.startsWith('$')) {
      continue;
    }

    // Handle different value types
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = value.trim();
    } else if (typeof value === 'number') {
      // Validate numbers
      if (isNaN(value) || !isFinite(value)) {
        continue;
      }
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      // Sanitize arrays
      sanitized[key] = value.filter((item) => {
        return typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean';
      });
    } else if (typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Validate and sanitize pagination parameters
 * @param {Object} query - Query object with page and limit
 * @returns {Object} Sanitized pagination { page, limit, skip }
 */
export const sanitizePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

/**
 * Validate and sanitize sort parameters
 * @param {String} sort - Sort string (e.g., "name:asc" or "price:desc")
 * @param {Array} allowedFields - Allowed fields for sorting
 * @returns {Object} MongoDB sort object
 */
export const sanitizeSort = (sort, allowedFields = []) => {
  if (!sort || typeof sort !== 'string') {
    return { createdAt: -1 }; // Default sort
  }

  const [field, direction] = sort.split(':');
  const dir = direction === 'asc' ? 1 : -1;

  // Only allow sorting by whitelisted fields
  if (allowedFields.length > 0 && !allowedFields.includes(field)) {
    return { createdAt: -1 }; // Default sort
  }

  return { [field]: dir };
};

/**
 * Sanitize search string to prevent injection
 * @param {String} search - Search string
 * @returns {String} Sanitized search string
 */
export const sanitizeSearch = (search) => {
  if (!search || typeof search !== 'string') {
    return '';
  }

  // Remove dangerous characters
  return search
    .trim()
    .replace(/[<>{}[\]\\]/g, '')
    .substring(0, 100); // Limit length
};

