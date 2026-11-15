import test from 'node:test';
import assert from 'node:assert/strict';

import {
    loadCatalog,
    findEgg,
    filterEggs
} from '../../../src/core/catalog/catalog.mjs';

test('loads all registered Eggs', async () => {
    const catalog = await loadCatalog();

    assert.equal(catalog.length, 7);
    assert.equal(new Set(catalog.map(egg => egg.id)).size, 7);
});

test('catalog is sorted by ID', async () => {
    const catalog = await loadCatalog();

    const ids = catalog.map(egg => egg.id);

    assert.deepEqual(
        ids,
        [...ids].sort((a, b) => a.localeCompare(b))
    );
});

test('finds an Egg by ID', async () => {
    const catalog = await loadCatalog();

    const egg = findEgg(
        catalog,
        'tyravex.minecraft.java.vanilla'
    );

    assert.equal(egg?.name, 'Minecraft Java - Vanilla');
    assert.equal(egg?.formatVersion, 2);
    assert.equal(
        egg?.path,
        'eggs-v2/games/minecraft-java-vanilla/egg.json'
    );
});

test('returns null for an unknown Egg', async () => {
    const catalog = await loadCatalog();

    assert.equal(
        findEgg(catalog, 'tyravex.unknown'),
        null
    );
});

test('filters Eggs by category', async () => {
    const catalog = await loadCatalog();

    const bots = filterEggs(catalog, {
        category: 'bots'
    });

    assert.equal(bots.length, 4);
    assert.ok(bots.every(egg => egg.category === 'bots'));
});

test('filters Eggs by format version', async () => {
    const catalog = await loadCatalog();

    const v1 = filterEggs(catalog, {
        formatVersion: 1
    });

    const v2 = filterEggs(catalog, {
        formatVersion: 2
    });

    assert.equal(v1.length, 6);
    assert.equal(v2.length, 1);
});

test('supports combined filters', async () => {
    const catalog = await loadCatalog();

    const result = filterEggs(catalog, {
        category: 'games',
        formatVersion: 2
    });

    assert.deepEqual(
        result.map(egg => egg.id),
        ['tyravex.minecraft.java.vanilla']
    );
});

test('returns an empty list when nothing matches', async () => {
    const catalog = await loadCatalog();

    assert.deepEqual(
        filterEggs(catalog, {
            category: 'nonexistent'
        }),
        []
    );
});

test('does not expose full Egg manifests', async () => {
    const catalog = await loadCatalog();

    for (const egg of catalog) {
        assert.equal('startup' in egg, false);
        assert.equal('install' in egg, false);
        assert.equal('variables' in egg, false);
        assert.equal('lifecycle' in egg, false);
    }
});
