import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCatalog } from '../../../src/core/catalog/catalog.mjs';

import {
    listPanelEggs,
    getPanelEgg,
    getPanelCategories,
    getPanelCatalogStats
} from '../../../src/core/catalog/panel-catalog.mjs';

const catalogPromise = loadCatalog();

test('panel lists all registered Eggs', async () => {
    const result = listPanelEggs(await catalogPromise);

    assert.equal(result.items.length, 8);
    assert.equal(result.pagination.total, 8);
});

test('panel searches by Egg name', async () => {
    const result = listPanelEggs(await catalogPromise, {
        query: 'minecraft'
    });

    assert.equal(result.items.length, 1);
    assert.equal(
        result.items[0].id,
        'tyravex.minecraft.java.vanilla'
    );
});

test('panel search ignores case and whitespace', async () => {
    const result = listPanelEggs(await catalogPromise, {
        query: '  MINECRAFT  '
    });

    assert.equal(result.items.length, 1);
});

test('panel filters by category', async () => {
    const result = listPanelEggs(await catalogPromise, {
        category: 'bots'
    });

    assert.equal(result.pagination.total, 5);
});

test('panel filters by format version', async () => {
    const result = listPanelEggs(await catalogPromise, {
        formatVersion: 2
    });

    assert.equal(result.pagination.total, 1);
});

test('panel combines search and filters', async () => {
    const result = listPanelEggs(await catalogPromise, {
        query: 'minecraft',
        category: 'games',
        formatVersion: 2
    });

    assert.equal(result.pagination.total, 1);
});

test('panel supports pagination', async () => {
    const catalog = await catalogPromise;

    const first = listPanelEggs(catalog, {
        page: 1,
        pageSize: 3
    });

    const second = listPanelEggs(catalog, {
        page: 2,
        pageSize: 3
    });

    assert.equal(first.items.length, 3);
    assert.equal(second.items.length, 3);
    assert.equal(first.pagination.totalPages, 3);
    assert.equal(first.pagination.hasNextPage, true);
    assert.equal(second.pagination.hasPreviousPage, true);

    const firstIds = new Set(first.items.map(egg => egg.id));

    assert.ok(
        second.items.every(egg => !firstIds.has(egg.id))
    );
});

test('panel returns empty page beyond last page', async () => {
    const result = listPanelEggs(await catalogPromise, {
        page: 999
    });

    assert.equal(result.items.length, 0);
    assert.equal(result.pagination.total, 8);
    assert.equal(result.pagination.hasNextPage, false);
});

test('panel supports descending sorting', async () => {
    const result = listPanelEggs(await catalogPromise, {
        sortBy: 'id',
        order: 'desc'
    });

    const ids = result.items.map(egg => egg.id);

    assert.deepEqual(
        ids,
        [...ids].sort((a, b) => b.localeCompare(a))
    );
});

test('panel retrieves Egg details', async () => {
    const egg = getPanelEgg(
        await catalogPromise,
        'tyravex.minecraft.java.vanilla'
    );

    assert.equal(egg.formatVersion, 2);
    assert.equal(egg.category, 'games');
});

test('panel returns null for missing Egg', async () => {
    assert.equal(
        getPanelEgg(await catalogPromise, 'tyravex.missing'),
        null
    );
});

test('panel provides category counts', async () => {
    const categories = getPanelCategories(await catalogPromise);

    assert.equal(
        categories.reduce((sum, item) => sum + item.count, 0),
        8
    );

    assert.equal(
        categories.find(item => item.id === 'bots')?.count,
        5
    );
});

test('panel provides dashboard statistics', async () => {
    const stats = getPanelCatalogStats(await catalogPromise);

    assert.equal(stats.total, 8);
    assert.equal(stats.byFormat.v1, 7);
    assert.equal(stats.byFormat.v2, 1);
});

test('panel rejects invalid pagination', async () => {
    const catalog = await catalogPromise;

    assert.throws(
        () => listPanelEggs(catalog, { page: 0 }),
        RangeError
    );

    assert.throws(
        () => listPanelEggs(catalog, { pageSize: 101 }),
        RangeError
    );

    assert.throws(
        () => listPanelEggs(catalog, { pageSize: 1.5 }),
        RangeError
    );
});

test('panel rejects invalid sorting and filters', async () => {
    const catalog = await catalogPromise;

    assert.throws(
        () => listPanelEggs(catalog, { sortBy: 'path' }),
        RangeError
    );

    assert.throws(
        () => listPanelEggs(catalog, { order: 'random' }),
        RangeError
    );

    assert.throws(
        () => listPanelEggs(catalog, { formatVersion: 3 }),
        RangeError
    );
});

test('panel does not expose manifest internals', async () => {
    const result = listPanelEggs(await catalogPromise);

    for (const egg of result.items) {
        assert.equal('variables' in egg, false);
        assert.equal('startup' in egg, false);
        assert.equal('lifecycle' in egg, false);
    }
});

test('panel response containers are immutable', async () => {
    const result = listPanelEggs(await catalogPromise);

    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.items), true);
    assert.equal(Object.isFrozen(result.pagination), true);

    assert.throws(
        () => result.items.push({ id: 'invalid' }),
        TypeError
    );
});

test('panel handles empty catalogs', () => {
    const result = listPanelEggs([]);
    const stats = getPanelCatalogStats([]);

    assert.deepEqual(result.items, []);
    assert.equal(result.pagination.totalPages, 0);
    assert.equal(stats.total, 0);
    assert.deepEqual(getPanelCategories([]), []);
});
