import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    validateEggV2 as validateFromCore,
    validateEggV2File as validateFileFromCore
} from '../../../src/core/validation/egg-v2.mjs';

import {
    validateEggV2 as validateFromLegacy,
    validateEggV2File as validateFileFromLegacy
} from '../../../scripts/validate-v2.mjs';

const fixtureUrl = new URL(
    '../../fixtures/v2/valid-egg.json',
    import.meta.url
);

test('legacy and core exports share the same functions', () => {
    assert.strictEqual(validateFromLegacy, validateFromCore);
    assert.strictEqual(validateFileFromLegacy, validateFileFromCore);
});

test('core and legacy imports validate the same Egg', async () => {
    const egg = JSON.parse(await readFile(fixtureUrl, 'utf8'));

    const expected = { valid: true, errors: [] };

    assert.deepEqual(validateFromCore(egg), expected);
    assert.deepEqual(validateFromLegacy(egg), expected);
});

test('file validation remains compatible', async () => {
    const coreResult = await validateFileFromCore(fixtureUrl);
    const legacyResult = await validateFileFromLegacy(fixtureUrl);

    assert.deepEqual(coreResult, legacyResult);
    assert.equal(coreResult.valid, true);
});