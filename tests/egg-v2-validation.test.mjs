import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateEggV2 } from '../scripts/validate-v2.mjs';

async function fixture(name) {
    return JSON.parse(
        await readFile(
            new URL(`./fixtures/v2/${name}`, import.meta.url),
            'utf8'
        )
    );
}

const valid = await fixture('valid-egg.json');
const invalid = await fixture('invalid-egg.json');

function changed(change) {
    const egg = structuredClone(valid);
    change(egg);
    return egg;
}

function rejects(name, change) {
    test(name, () => {
        const result = validateEggV2(changed(change));
        assert.equal(result.valid, false);
        assert.ok(result.errors.length > 0);
    });
}

test('accepts a valid Egg v2 manifest', () => {
    const result = validateEggV2(valid);
    assert.deepEqual(result, { valid: true, errors: [] });
});

test('rejects the invalid fixture', () => {
    assert.equal(validateEggV2(invalid).valid, false);
});

rejects('rejects an unsupported schema version', egg => {
    egg.schemaVersion = 3;
});

rejects('rejects an unpinned Docker image', egg => {
    egg.runtime.reference = 'node:latest';
});

rejects('rejects unknown root properties', egg => {
    egg.install = { command: 'curl example.com | sh' };
});

rejects('rejects shell command properties', egg => {
    egg.lifecycle.start.command = 'sh -c "node index.js"';
});

rejects('rejects missing lifecycle arguments', egg => {
    delete egg.lifecycle.start.args;
});

rejects('rejects invalid TCP/UDP protocols', egg => {
    egg.network.ports[0].protocol = 'sctp';
});

rejects('rejects ports outside the allowed range', egg => {
    egg.network.ports[0].containerPort = 65536;
});

rejects('rejects duplicate port names', egg => {
    egg.network.ports[1].name = 'http';
});

rejects('rejects duplicate protocol and container port', egg => {
    egg.network.ports[1].protocol = 'tcp';
    egg.network.ports[1].containerPort = 3000;
});

rejects('rejects duplicate storage names', egg => {
    egg.storage.mounts.push({
        name: 'data',
        containerPath: '/app/other'
    });
});

rejects('rejects duplicate storage paths', egg => {
    egg.storage.mounts.push({
        name: 'other',
        containerPath: '/app/data'
    });
});

rejects('rejects duplicate variable names', egg => {
    egg.variables.push({
        name: 'APP_TOKEN',
        type: 'string',
        required: false
    });
});

rejects('rejects unsafe mount path traversal', egg => {
    egg.storage.mounts[0].containerPath = '/app/../host';
});

rejects('rejects unsafe executable traversal', egg => {
    egg.lifecycle.start.executable = '../bin/node';
});

rejects('rejects an archive without integrity digest', egg => {
    egg.source = {
        kind: 'archive',
        url: 'https://example.com/application.tar.gz'
    };
});

rejects('rejects an archive without URL', egg => {
    egg.source = {
        kind: 'archive',
        sha256: 'a'.repeat(64)
    };
});

rejects('rejects HTTP archive sources', egg => {
    egg.source = {
        kind: 'archive',
        url: 'http://example.com/application.tar.gz',
        sha256: 'a'.repeat(64)
    };
});

rejects('rejects archive fields when source is none', egg => {
    egg.source = {
        kind: 'none',
        url: 'https://example.com/application.tar.gz'
    };
});

test('accepts a structurally valid archive source', () => {
    const egg = changed(egg => {
        egg.source = {
            kind: 'archive',
            url: 'https://example.com/application.tar.gz',
            sha256: 'b'.repeat(64)
        };
    });

    assert.equal(validateEggV2(egg).valid, true);
});