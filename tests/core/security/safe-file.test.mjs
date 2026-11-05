import test from 'node:test';
import assert from 'node:assert/strict';

import {
    mkdtemp,
    writeFile,
    mkdir,
    rm
} from 'node:fs/promises';

import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    assertSafeFile,
    readSafeJson
} from '../../../src/core/security/safe-file.mjs';

async function withFixture(run) {
    const root = await mkdtemp(
        join(tmpdir(), 'tyravex-safe-file-')
    );

    try {
        await writeFile(
            join(root, 'valid.json'),
            '{"value":42}',
            'utf8'
        );

        await mkdir(join(root, 'directory'));

        await run(root);
    } finally {
        await rm(root, {
            recursive: true,
            force: true
        });
    }
}

test('accepts a regular JSON file', async () => {
    await withFixture(async root => {
        await assertSafeFile(root, 'valid.json');

        const data = await readSafeJson(
            root,
            'valid.json'
        );

        assert.deepEqual(data, { value: 42 });
    });
});

test('rejects parent traversal', async () => {
    await withFixture(async root => {
        await assert.rejects(
            assertSafeFile(root, '../outside.json'),
            /Unsafe file path/
        );
    });
});

test('rejects an absolute path outside root', async () => {
    await withFixture(async root => {
        const outside = join(
            tmpdir(),
            'outside.json'
        );

        await assert.rejects(
            assertSafeFile(root, outside),
            /Unsafe file path/
        );
    });
});

test('rejects root as a file', async () => {
    await withFixture(async root => {
        await assert.rejects(
            assertSafeFile(root, '.'),
            /Unsafe file path/
        );
    });
});

test('rejects directories', async () => {
    await withFixture(async root => {
        await assert.rejects(
            assertSafeFile(root, 'directory'),
            /Not a regular file/
        );
    });
});

test('rejects missing files', async () => {
    await withFixture(async root => {
        await assert.rejects(
            readSafeJson(root, 'missing.json'),
            { code: 'ENOENT' }
        );
    });
});

test('rejects malformed JSON', async () => {
    await withFixture(async root => {
        await writeFile(
            join(root, 'invalid.json'),
            '{ broken json',
            'utf8'
        );

        await assert.rejects(
            readSafeJson(root, 'invalid.json'),
            SyntaxError
        );
    });
});
