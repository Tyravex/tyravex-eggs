import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loadEgg = async () =>
    JSON.parse(
        await readFile(
            new URL('../eggs/applications/universal-nodejs/egg.json', import.meta.url),
            'utf8'
        )
    );

test('Universal Node.js: identity and runtime', async () => {
    const egg = await loadEgg();

    assert.equal(egg.id, 'tyravex.universal.nodejs');
    assert.equal(egg.category, 'applications');
    assert.equal(egg.install.mode, 'nodejs');
    assert.equal(egg.install.packageManager, 'npm');
    assert.equal(egg.runtime.defaultVersion, '22');

    assert.deepEqual(
        egg.runtime.versions.map(v => v.version),
        ['20', '22', '24']
    );
});

test('Universal Node.js: startup profiles', async () => {
    const egg = await loadEgg();

    assert.deepEqual(
        egg.profiles.map(p => p.id),
        ['npm-start', 'javascript', 'commonjs', 'esm']
    );

    assert.ok(
        egg.profiles.some(p => p.id === egg.defaultProfile)
    );

    const expected = {
        'npm-start': { mode: 'npm-start' },
        javascript: { mode: 'node-file', entrypoint: 'index.js' },
        commonjs: { mode: 'node-file', entrypoint: 'index.cjs' },
        esm: { mode: 'node-file', entrypoint: 'index.mjs' }
    };

    for (const profile of egg.profiles) {
        assert.deepEqual(profile.startup, expected[profile.id]);

        assert.ok(
            egg.runtime.versions.some(
                v => v.version === profile.runtimeVersion
            )
        );
    }
});

test('Universal Node.js: no required platform token', async () => {
    const egg = await loadEgg();

    assert.ok(Array.isArray(egg.variables));

    assert.equal(
        egg.variables.some(
            v =>
                v.required &&
                ['DISCORD_TOKEN', 'TELEGRAM_BOT_TOKEN'].includes(v.name)
        ),
        false
    );
});