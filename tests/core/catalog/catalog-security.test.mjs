import test from 'node:test';
import assert from 'node:assert/strict';

import {
    mkdtemp,
    mkdir,
    cp,
    readFile,
    writeFile,
    rm,
    symlink
} from 'node:fs/promises';

import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    loadCatalog,
    CatalogError
} from '../../../src/core/catalog/catalog.mjs';

const repo = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../..'
);

async function withFixture(run) {
    const root = await mkdtemp(
        join(tmpdir(), 'tyravex-catalog-security-')
    );

    try {
        for (const file of [
            'registry.json',
            'registry.v2.json'
        ]) {
            await cp(join(repo, file), join(root, file));
        }

        for (const directory of [
            'schemas',
            'eggs',
            'eggs-v2'
        ]) {
            await cp(
                join(repo, directory),
                join(root, directory),
                { recursive: true }
            );
        }

        await run(root);
    } finally {
        await rm(root, {
            recursive: true,
            force: true
        });
    }
}

async function expectCatalogFailure(root) {
    await assert.rejects(
        loadCatalog(root),
        error => {
            assert.ok(error instanceof CatalogError);

            assert.ok([
                'VALIDATION_FAILED',
                'READ_FAILED'
            ].includes(error.code));

            return true;
        }
    );
}

async function createFileSymlinkOrSkip(
    t,
    target,
    path
) {
    try {
        await symlink(target, path, 'file');
        return true;
    } catch (error) {
        if (
            process.platform === 'win32' &&
            ['EPERM', 'EACCES'].includes(error.code)
        ) {
            t.skip(
                'Windows does not permit creating file symlinks'
            );

            return false;
        }

        throw error;
    }
}

test('rejects malformed v1 registry JSON', async () => {
    await withFixture(async root => {
        await writeFile(
            join(root, 'registry.json'),
            '{ invalid json',
            'utf8'
        );

        await expectCatalogFailure(root);
    });
});

test('rejects malformed v2 registry JSON', async () => {
    await withFixture(async root => {
        await writeFile(
            join(root, 'registry.v2.json'),
            '{ invalid json',
            'utf8'
        );

        await expectCatalogFailure(root);
    });
});

test('rejects missing v1 registry', async () => {
    await withFixture(async root => {
        await rm(join(root, 'registry.json'));

        await expectCatalogFailure(root);
    });
});

test('rejects missing v2 registry', async () => {
    await withFixture(async root => {
        await rm(join(root, 'registry.v2.json'));

        await expectCatalogFailure(root);
    });
});

test('rejects a symlinked v2 manifest', async t => {
    await withFixture(async root => {
        const path = join(
            root,
            'eggs-v2/games/minecraft-java-vanilla/egg.json'
        );

        const target = join(root, 'minecraft-copy.json');

        await cp(path, target);
        await rm(path);

        if (
            !await createFileSymlinkOrSkip(t, target, path)
        ) {
            return;
        }

        await expectCatalogFailure(root);
    });
});

test('rejects a symlinked v1 manifest', async t => {
    await withFixture(async root => {
        const path = join(
            root,
            'eggs/bots/discord-nodejs/egg.json'
        );

        const target = join(root, 'discord-copy.json');

        await cp(path, target);
        await rm(path);

        if (
            !await createFileSymlinkOrSkip(t, target, path)
        ) {
            return;
        }

        await expectCatalogFailure(root);
    });
});

test('rejects a symlinked v2 directory', async () => {
    await withFixture(async root => {
        const source = join(root, 'eggs-v2');
        const target = join(root, 'eggs-v2-copy');

        await cp(source, target, { recursive: true });
        await rm(source, { recursive: true, force: true });

        await symlink(target, source, 'junction');

        await expectCatalogFailure(root);
    });
});

test('rejects an invalid v1 manifest JSON', async () => {
    await withFixture(async root => {
        await writeFile(
            join(root, 'eggs/bots/discord-nodejs/egg.json'),
            '{ invalid json',
            'utf8'
        );

        await expectCatalogFailure(root);
    });
});

test('rejects an invalid v2 manifest JSON', async () => {
    await withFixture(async root => {
        await writeFile(
            join(
                root,
                'eggs-v2/games/minecraft-java-vanilla/egg.json'
            ),
            '{ invalid json',
            'utf8'
        );

        await expectCatalogFailure(root);
    });
});
