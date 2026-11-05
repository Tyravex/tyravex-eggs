import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    mkdir,
    cp,
    readFile,
    writeFile,
    rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    loadCatalog
} from '../../../src/core/catalog/catalog.mjs';

const repo = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../..'
);

const v1Registry = 'registry.json';
const v2Registry = 'registry.v2.json';

const files = [
    v1Registry,
    v2Registry,
    'schemas/v1/egg.schema.json',
    'schemas/v1/registry.schema.json',
    'schemas/v2/egg.schema.json',
    'schemas/v2/registry.schema.json',
    'eggs/bots/discord-nodejs/egg.json',
    'eggs/bots/discord-python/egg.json',
    'eggs/bots/telegram-nodejs/egg.json',
    'eggs/bots/telegram-python/egg.json',
    'eggs/applications/universal-nodejs/egg.json',
    'eggs/applications/universal-python/egg.json',
    'eggs-v2/games/minecraft-java-vanilla/egg.json'
];

async function withFixture(run) {
    const root = await mkdtemp(
        join(tmpdir(), 'tyravex-catalog-')
    );

    try {
        for (const file of files) {
            const destination = join(root, file);

            await mkdir(dirname(destination), {
                recursive: true
            });

            await cp(join(repo, file), destination);
        }

        await run(root);
    } finally {
        await rm(root, {
            recursive: true,
            force: true
        });
    }
}

async function updateJson(root, relativePath, change) {
    const path = join(root, relativePath);

    const data = JSON.parse(
        await readFile(path, 'utf8')
    );

    change(data);

    await writeFile(
        path,
        JSON.stringify(data, null, 2) + '\n',
        'utf8'
    );
}

test('loads a valid isolated catalog', async () => {
    await withFixture(async root => {
        const catalog = await loadCatalog(root);

        assert.equal(catalog.length, 7);
    });
});

test('rejects duplicate IDs in v1 registry', async () => {
    await withFixture(async root => {
        await updateJson(root, v1Registry, registry => {
            registry.eggs[1].id = registry.eggs[0].id;
        });

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects duplicate IDs in v2 registry', async () => {
    await withFixture(async root => {
        await updateJson(root, v2Registry, registry => {
            registry.eggs.push({
                ...registry.eggs[0]
            });
        });

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects IDs shared by v1 and v2', async () => {
    await withFixture(async root => {
        const v1 = JSON.parse(
            await readFile(join(root, v1Registry), 'utf8')
        );

        await updateJson(root, v2Registry, registry => {
            registry.eggs[0].id = v1.eggs[0].id;
        });

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects a missing v1 manifest', async () => {
    await withFixture(async root => {
        await rm(
            join(root, 'eggs/bots/discord-nodejs/egg.json')
        );

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects a missing v2 manifest', async () => {
    await withFixture(async root => {
        await rm(
            join(
                root,
                'eggs-v2/games/minecraft-java-vanilla/egg.json'
            )
        );

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects invalid v1 manifest metadata', async () => {
    await withFixture(async root => {
        await updateJson(
            root,
            'eggs/bots/discord-nodejs/egg.json',
            egg => {
                egg.id = 'tyravex.invalid.discord';
            }
        );

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects invalid v2 manifest', async () => {
    await withFixture(async root => {
        await updateJson(
            root,
            'eggs-v2/games/minecraft-java-vanilla/egg.json',
            egg => {
                egg.schemaVersion = 999;
            }
        );

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects unsafe registry traversal paths', async () => {
    await withFixture(async root => {
        await updateJson(root, v1Registry, registry => {
            registry.eggs[0].path = '../outside/egg.json';
        });

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});

test('rejects unsupported registry schema version', async () => {
    await withFixture(async root => {
        await updateJson(root, v2Registry, registry => {
            registry.schemaVersion = 999;
        });

        await assert.rejects(
            loadCatalog(root),
            /Egg catalog validation failed/
        );
    });
});
