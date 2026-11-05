import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loadEgg = async () =>
    JSON.parse(
        await readFile(
            new URL('../../../../eggs/bots/telegram-nodejs/egg.json', import.meta.url),
            'utf8'
        )
    );

test('Telegram Node.js: identity and runtime', async () => {
    const egg = await loadEgg();

    assert.equal(egg.id, 'tyravex.telegram.nodejs');
    assert.equal(egg.category, 'bots');
    assert.equal(egg.install.mode, 'nodejs');
    assert.equal(egg.install.packageManager, 'npm');
    assert.equal(egg.runtime.defaultVersion, '22');

    assert.deepEqual(
        egg.runtime.versions.map(v => v.version),
        ['20', '22', '24']
    );
});

test('Telegram Node.js: Telegraf, grammY and Generic profiles', async () => {
    const egg = await loadEgg();

    assert.deepEqual(
        egg.profiles.map(p => p.id),
        ['telegraf', 'grammy', 'generic']
    );

    assert.ok(
        egg.profiles.some(p => p.id === egg.defaultProfile)
    );

    for (const profile of egg.profiles) {
        assert.ok(['npm-start', 'node-file'].includes(profile.startup.mode));

        if (profile.startup.mode === 'node-file') {
            assert.match(profile.startup.entrypoint, /\.(js|cjs|mjs)$/);
        }

        assert.ok(
            egg.runtime.versions.some(
                v => v.version === profile.runtimeVersion
            )
        );
    }
});

test('Telegram Node.js: bot token is a required secret', async () => {
    const egg = await loadEgg();

    assert.ok(
        egg.variables.some(
            v =>
                v.name === 'TELEGRAM_BOT_TOKEN' &&
                v.type === 'secret' &&
                v.required === true
        )
    );
});
