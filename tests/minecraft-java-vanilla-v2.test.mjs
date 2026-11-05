import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateEggV2 } from '../scripts/validate-v2.mjs';
import { validateRegistryV2 } from '../scripts/validate-registry-v2.mjs';

const egg = JSON.parse(
    await readFile(
        new URL(
            '../eggs-v2/games/minecraft-java-vanilla/egg.json',
            import.meta.url
        ),
        'utf8'
    )
);

test('Minecraft Vanilla satisfies Egg v2 schema', () => {
    const result = validateEggV2(egg);
    assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('Minecraft Vanilla has correct identity', () => {
    assert.equal(egg.metadata.id, 'tyravex.minecraft.java.vanilla');
    assert.equal(egg.metadata.category, 'games');
    assert.equal(egg.schemaVersion, 2);
});

test('Minecraft Vanilla uses digest-pinned Java 21 image', () => {
    assert.match(
        egg.runtime.reference,
        /^docker\.io\/library\/eclipse-temurin@sha256:[a-f0-9]{64}$/
    );
    assert.equal(egg.runtime.workingDirectory, '/app');
});

test('Minecraft Vanilla exposes only its declared TCP port', () => {
    assert.deepEqual(egg.network.ports, [
        {
            name: 'minecraft',
            protocol: 'tcp',
            containerPort: 25565
        }
    ]);
});

test('Minecraft Vanilla declares persistent data directory', () => {
    assert.deepEqual(egg.storage.mounts, [
        {
            name: 'minecraft-data',
            containerPath: '/data'
        }
    ]);
});

test('Minecraft Vanilla uses argv without shell execution', () => {
    assert.deepEqual(egg.lifecycle.start, {
        executable: 'java',
        args: ['-jar', '/data/server.jar', 'nogui']
    });

    assert.equal(
        Object.hasOwn(egg.lifecycle.start, 'command'),
        false
    );
});

test('Minecraft Vanilla does not automatically download a JAR', () => {
    assert.deepEqual(egg.source, { kind: 'none' });
    assert.deepEqual(egg.variables, []);
});

test('Minecraft Vanilla is registered without v1 collision', async () => {
    const result = await validateRegistryV2();

    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.count, 1);
});