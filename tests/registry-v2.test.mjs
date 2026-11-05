import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    mkdir,
    readFile,
    writeFile,
    rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRegistryV2 } from '../scripts/validate-registry-v2.mjs';

const fixture = JSON.parse(
    await readFile(
        new URL('./fixtures/v2/valid-egg.json', import.meta.url),
        'utf8'
    )
);

const eggPath = 'eggs-v2/applications/example-nodejs/egg.json';

function entryFromEgg(egg = fixture, path = eggPath) {
    return {
        id: egg.metadata.id,
        name: egg.metadata.name,
        description: egg.metadata.description,
        category: egg.metadata.category,
        version: egg.metadata.version,
        path
    };
}

async function writeJson(path, value) {
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(
        path,
        JSON.stringify(value, null, 2) + '\n',
        'utf8'
    );
}

async function createWorkspace(t, options = {}) {
    const root = await mkdtemp(
        join(tmpdir(), 'tyravex-registry-v2-')
    );

    t.after(async () => {
        await rm(root, { recursive: true, force: true });
    });

    await writeJson(join(root, 'registry.json'), {
        schemaVersion: 1,
        eggs: [
            {
                id: 'tyravex.legacy.nodejs'
            }
        ]
    });

    const registry = {
        schemaVersion: 2,
        eggs: []
    };

    if (options.registered !== false) {
        registry.eggs.push(entryFromEgg());
    }

    await writeJson(
        join(root, 'registry.v2.json'),
        registry
    );

    if (options.manifest !== false) {
        await writeJson(
            join(root, eggPath),
            fixture
        );
    }

    return {
        root,
        registry,
        egg: structuredClone(fixture)
    };
}

test('accepts empty v2 registry without eggs-v2 directory', async t => {
    const { root } = await createWorkspace(t, {
        registered: false,
        manifest: false
    });

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.count, 0);
});

test('accepts a registered valid v2 manifest', async t => {
    const { root } = await createWorkspace(t);
    const result = await validateRegistryV2(root);

    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.count, 1);
});

test('rejects duplicate registry IDs', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.eggs.push({
        ...entryFromEgg(),
        path: 'eggs-v2/applications/another/egg.json'
    });

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /duplicate id/);
});

test('rejects duplicate registry paths', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.eggs.push({
        ...entryFromEgg(),
        id: 'tyravex.example.other'
    });

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /duplicate path/);
});

test('rejects IDs already used by v1', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.eggs[0].id = 'tyravex.legacy.nodejs';

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /conflicts with v1/);
});

test('rejects traversal in registry paths', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.eggs[0].path = '../outside/egg.json';

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
});

test('rejects category mismatch in path', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.eggs[0].category = 'bots';

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /path category mismatch/);
});

test('rejects mismatched manifest metadata', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.eggs[0].version = '9.9.9';

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /version does not match/);
});

test('rejects invalid registered v2 manifest', async t => {
    const { root, egg } = await createWorkspace(t);

    egg.runtime.reference = 'node:latest';

    await writeJson(join(root, eggPath), egg);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
});

test('rejects a missing registered manifest', async t => {
    const { root } = await createWorkspace(t, {
        manifest: false
    });

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /cannot read manifest/);
});

test('rejects an unregistered v2 manifest', async t => {
    const { root } = await createWorkspace(t, {
        registered: false
    });

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /not listed in v2 registry/);
});

test('rejects unknown registry properties', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.install = {
        command: 'sh'
    };

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
});

test('rejects unsupported registry schema version', async t => {
    const { root, registry } = await createWorkspace(t);

    registry.schemaVersion = 3;

    await writeJson(join(root, 'registry.v2.json'), registry);

    const result = await validateRegistryV2(root);

    assert.equal(result.valid, false);
});