import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loadEgg = async (name) =>
    JSON.parse(
        await readFile(
            new URL(`../../../../eggs/bots/${name}/egg.json`, import.meta.url),
            'utf8'
        )
    );

for (const [folder, platform, token] of [
    ['discord-python', 'discord', 'DISCORD_TOKEN'],
    ['telegram-python', 'telegram', 'TELEGRAM_BOT_TOKEN'],
]) {
    test(`${folder}: correct identity and runtime`, async () => {
        const egg = await loadEgg(folder);

        assert.equal(egg.id, `tyravex.${platform}.python`);
        assert.equal(egg.install.mode, 'python');
        assert.equal(egg.install.packageManager, 'pip');
        assert.equal(egg.runtime.defaultVersion, '3.12');

        assert.deepEqual(
            egg.runtime.versions.map((v) => v.version),
            ['3.11', '3.12', '3.13']
        );
    });

    test(`${folder}: valid Python profiles`, async () => {
        const egg = await loadEgg(folder);

        assert.ok(egg.profiles.length > 0);
        assert.ok(egg.profiles.some((p) => p.id === egg.defaultProfile));

        for (const profile of egg.profiles) {
            assert.equal(profile.startup.mode, 'python-file');
            assert.match(profile.startup.entrypoint, /\.py$/);
            assert.ok(
                egg.runtime.versions.some(
                    (v) => v.version === profile.runtimeVersion
                )
            );
        }
    });

    test(`${folder}: token is declared as secret`, async () => {
        const egg = await loadEgg(folder);

        assert.ok(
            egg.variables.some(
                (v) =>
                    v.name === token &&
                    v.type === 'secret' &&
                    v.required === true
            )
        );
    });
}
