import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateRegistryV1 } from '../../../src/core/registry/registry-v1.mjs';
import { validateRegistryV2 } from '../../../src/core/registry/registry-v2.mjs';

test('v1 provides validated registry entries through callback', async () => {
    let snapshot;

    const result = await validateRegistryV1(undefined, {
        onValidatedRegistry(entries) {
            snapshot = entries;
        }
    });

    assert.equal(result.valid, true);
    assert.equal(result.count, 6);
    assert.equal(snapshot.length, 6);
    assert.ok(snapshot.every(entry => typeof entry.id === 'string'));
});

test('v2 provides validated registry entries through callback', async () => {
    let snapshot;

    const result = await validateRegistryV2(undefined, {
        onValidatedRegistry(entries) {
            snapshot = entries;
        }
    });

    assert.equal(result.valid, true);
    assert.equal(result.count, 1);
    assert.equal(snapshot.length, 1);
    assert.ok(snapshot.every(entry => typeof entry.id === 'string'));
});

test('v1 callback receives an independent snapshot', async () => {
    let snapshot;

    const result = await validateRegistryV1(undefined, {
        onValidatedRegistry(entries) {
            snapshot = entries;
            entries[0].name = 'Changed by callback';
        }
    });

    assert.equal(result.valid, true);

    const second = await validateRegistryV1();
    assert.equal(second.valid, true);
});

test('v2 callback receives an independent snapshot', async () => {
    let snapshot;

    const result = await validateRegistryV2(undefined, {
        onValidatedRegistry(entries) {
            snapshot = entries;
            entries[0].name = 'Changed by callback';
        }
    });

    assert.equal(result.valid, true);

    const second = await validateRegistryV2();
    assert.equal(second.valid, true);
});
