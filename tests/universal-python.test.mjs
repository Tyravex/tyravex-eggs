import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loadEgg = async () =>
    JSON.parse(
        await readFile(
            new URL('../eggs/applications/universal-python/egg.json', import.meta.url),
            'utf8'
        )
    );

test('Universal Python: identity and runtime', async () => {
    const egg = await loadEgg();

    assert.equal(egg.id, 'tyravex.universal.python');
    assert.equal(egg.category, 'applications');
    assert.equal(egg.install.mode, 'python');
    assert.equal(egg.install.packageManager, 'pip');
    assert.equal(egg.runtime.defaultVersion, '3.12');

    assert.deepEqual(
        egg.runtime.versions.map(v => v.version),
        ['3.11', '3.12', '3.13']
    );
});

test('Universal Python: startup profiles', async () => {
    const egg = await loadEgg();

    assert.deepEqual(
        egg.profiles.map(p => p.id),
        ['main', 'app', 'worker']
    );

    assert.ok(
        egg.profiles.some(p => p.id === egg.defaultProfile)
    );

    const expected = {
        main: 'main.py',
        app: 'app.py',
        worker: 'worker.py'
    };

    for (const profile of egg.profiles) {
        assert.equal(profile.startup.mode, 'python-file');
        assert.equal(
            profile.startup.entrypoint,
            expected[profile.id]
        );

        assert.ok(
            egg.runtime.versions.some(
                v => v.version === profile.runtimeVersion
            )
        );
    }
});

test('Universal Python: no required platform token', async () => {
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