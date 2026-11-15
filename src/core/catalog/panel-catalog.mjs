import { findEgg } from './catalog.mjs';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

function requireCatalog(catalog) {
    if (!Array.isArray(catalog)) {
        throw new TypeError('catalog must be an array');
    }
}

function normalizeQuery(query) {
    if (query === undefined || query === null) return '';

    if (typeof query !== 'string') {
        throw new TypeError('query must be a string');
    }

    return query.trim().toLocaleLowerCase();
}

function positiveInteger(value, name, fallback, maximum) {
    if (value === undefined) return fallback;

    if (!Number.isSafeInteger(value) || value < 1) {
        throw new RangeError(`${name} must be a positive integer`);
    }

    if (maximum !== undefined && value > maximum) {
        throw new RangeError(`${name} must not exceed ${maximum}`);
    }

    return value;
}

function optionalFormatVersion(value) {
    if (value === undefined) return undefined;

    if (value !== 1 && value !== 2) {
        throw new RangeError('formatVersion must be 1 or 2');
    }

    return value;
}

function optionalCategory(value) {
    if (value === undefined) return undefined;

    if (typeof value !== 'string') {
        throw new TypeError('category must be a string');
    }

    return value;
}

function compareEggs(a, b, sortBy, order) {
    const direction = order === 'desc' ? -1 : 1;

    const first = String(a[sortBy] ?? '');
    const second = String(b[sortBy] ?? '');

    const result = first.localeCompare(second);

    if (result !== 0) return result * direction;

    return a.id.localeCompare(b.id);
}

export function listPanelEggs(catalog, options = {}) {
    requireCatalog(catalog);

    const {
        query,
        category,
        formatVersion,
        page,
        pageSize,
        sortBy = 'name',
        order = 'asc'
    } = options;

    const search = normalizeQuery(query);
    const selectedCategory = optionalCategory(category);
    const selectedFormat = optionalFormatVersion(formatVersion);
    const currentPage = positiveInteger(page, 'page', 1);
    const limit = positiveInteger(
        pageSize,
        'pageSize',
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE
    );

    if (!['id', 'name', 'category', 'version'].includes(sortBy)) {
        throw new RangeError('unsupported sortBy field');
    }

    if (!['asc', 'desc'].includes(order)) {
        throw new RangeError('order must be asc or desc');
    }

    const filtered = catalog.filter(egg => {
        if (
            selectedCategory !== undefined &&
            egg.category !== selectedCategory
        ) {
            return false;
        }

        if (
            selectedFormat !== undefined &&
            egg.formatVersion !== selectedFormat
        ) {
            return false;
        }

        if (!search) return true;

        return [
            egg.id,
            egg.name,
            egg.description
        ].some(value =>
            String(value ?? '')
                .toLocaleLowerCase()
                .includes(search)
        );
    });

    filtered.sort((a, b) =>
        compareEggs(a, b, sortBy, order)
    );

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (currentPage - 1) * limit;

    const items = Object.freeze(
        filtered.slice(start, start + limit)
    );

    return Object.freeze({
        items,
        pagination: Object.freeze({
            page: currentPage,
            pageSize: limit,
            total,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1 && totalPages > 0
        })
    });
}

export function getPanelEgg(catalog, id) {
    requireCatalog(catalog);

    if (typeof id !== 'string' || !id) {
        throw new TypeError('id must be a non-empty string');
    }

    return findEgg(catalog, id);
}

export function getPanelCategories(catalog) {
    requireCatalog(catalog);

    const counts = new Map();

    for (const egg of catalog) {
        counts.set(
            egg.category,
            (counts.get(egg.category) ?? 0) + 1
        );
    }

    return Object.freeze(
        [...counts.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, count]) =>
                Object.freeze({ id, count })
            )
    );
}

export function getPanelCatalogStats(catalog) {
    requireCatalog(catalog);

    const categories = getPanelCategories(catalog);

    const byFormat = Object.freeze({
        v1: catalog.filter(egg => egg.formatVersion === 1).length,
        v2: catalog.filter(egg => egg.formatVersion === 2).length
    });

    return Object.freeze({
        total: catalog.length,
        byFormat,
        categories
    });
}
