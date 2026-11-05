import test from 'node:test';
import assert from 'node:assert/strict';

import {
    validateRegistryV2 as validateFromCore
} from '../../../src/core/registry/registry-v2.mjs';

import {
    validateRegistryV2 as validateFromLegacy
} from '../../../scripts/validate-registry-v2.mjs';

test('registry v2 legacy and core exports share the same function', () => {
    assert.strictEqual(
        validateFromLegacy,
        validateFromCore
    );
});

test('registry v2 core validates the canonical repository', async () => {
    const result = await validateFromCore();

    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.count, 1);
    assert.deepEqual(result.errors, []);
});

test('registry v2 legacy and core return the same result', async () => {
    const coreResult = await validateFromCore();
    const legacyResult = await validateFromLegacy();

    assert.deepEqual(legacyResult, coreResult);
});