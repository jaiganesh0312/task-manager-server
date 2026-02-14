/**
 * Build pagination options for Sequelize queries
 */
const getPaginationOptions = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

/**
 * Build pagination response
 */
const getPaginatedResponse = (data, count, options) => {
    const { page, limit } = options;
    const totalPages = Math.ceil(count / limit);

    return {
        data,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};

/**
 * Build filter options from query params
 */
const getFilterOptions = (query, allowedFilters) => {
    const filters = {};

    allowedFilters.forEach((filter) => {
        if (query[filter] !== undefined && query[filter] !== "") {
            filters[filter] = query[filter];
        }
    });

    return filters;
};

/**
 * Build sort options from query params
 */
const getSortOptions = (query, allowedSorts, defaultSort = "createdAt", defaultOrder = "DESC") => {
    let sortField = query.sortBy || defaultSort;
    let sortOrder = (query.order || defaultOrder).toUpperCase();

    // Validate sort field
    if (!allowedSorts.includes(sortField)) {
        sortField = defaultSort;
    }

    // Validate sort order
    if (!["ASC", "DESC"].includes(sortOrder)) {
        sortOrder = defaultOrder;
    }

    return [[sortField, sortOrder]];
};

module.exports = {
    getPaginationOptions,
    getPaginatedResponse,
    getFilterOptions,
    getSortOptions,
};
