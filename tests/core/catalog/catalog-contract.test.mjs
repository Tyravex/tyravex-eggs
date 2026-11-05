import test from 'node:test';
import assert from 'node:assert/strict';

import {
    loadCatalog,
    findEgg,
    filterEggs,
    CatalogError
} from '../../../src/core/catalog/catalog.mjs';

test('catalog entries are immutable', async () => {
    const catalog = await loadCatalog();

    assert.equal(Object.isFrozen(catalog), true);

    for (const egg of catalog) {
        assert.equal(Object.isFrozen(egg), true);
    }

    assert.throws(() => {
        catalog.push({ id: 'invalid' });
    }, TypeError);

    assert.throws(() => {
        catalog[0].name = 'Modified';
    }, TypeError);
});

test('filter results are immutable', async () => {
    const catalog = await loadCatalog();

    const filtered = filterEggs(catalog, {
        category: 'bots'
    });

    assert.equal(Object.isFrozen(filtered), true);

    assert.throws(() => {
        filtered.pop();
    }, TypeError);
});

test('filtering does not change the original catalog', async () => {
    const catalog = await loadCatalog();

    filterEggs(catalog, {
        formatVersion: 2
    });

    assert.equal(catalog.length, 7);
});

test('findEgg works with an empty catalog', () => {
    assert.equal(findEgg([], 'unknown'), null);
});

test('filterEggs works with an empty catalog', () => {
    const result = filterEggs([], {
        category: 'bots'
    });

    assert.deepEqual(result, []);
    assert.equal(Object.isFrozen(result), true);
});

test('filterEggs without filters returns all entries', async () => {
    const catalog = await loadCatalog();

    const result = filterEggs(catalog);

    assert.deepEqual(result, catalog);
    assert.notStrictEqual(result, catalog);
});

test('CatalogError exposes a stable error contract', () => {
    const cause = new Error('original failure');

    const error = new CatalogError(
        'READ_FAILED',
        'Egg catalog could not be read',
        {
            cause,
            details: ['registry.json']
        }
    );

    assert.equal(error.name, 'CatalogError');
    assert.equal(error.code, 'READ_FAILED');
    assert.equal(error.cause, cause);
    assert.deepEqual(error.details, ['registry.json']);
    assert.equal(Object.isFrozen(error.details), true);
});

test('CatalogError details cannot be modified', () => {
    const error = new CatalogError(
        'VALIDATION_FAILED',
        'Egg catalog validation failed',
        {
            details: ['invalid registry']
        }
    );

    assert.throws(() => {
        error.details.push('another error');
    }, TypeError);
});
