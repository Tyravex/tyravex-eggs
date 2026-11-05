import test from 'node:test';
import assert from 'node:assert/strict';

import {
    validateRegistryV1 as validateFromCore
} from '../../../src/core/registry/registry-v1.mjs';

import {
    validateRegistryV1 as validateFromLegacy
} from '../../../scripts/validate.mjs';

test('registry v1 legacy and core share the same function', () => {
    assert.strictEqual(validateFromLegacy, validateFromCore);
});

test('registry v1 core validates the canonical repository', async () => {
    const result = await validateFromCore();

    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.count, 6);
    assert.deepEqual(result.errors, []);
});

test('registry v1 legacy and core return the same result', async () => {
    const coreResult = await validateFromCore();
    const legacyResult = await validateFromLegacy();

    assert.deepEqual(legacyResult, coreResult);
});
