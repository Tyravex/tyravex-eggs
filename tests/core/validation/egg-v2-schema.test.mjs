import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = JSON.parse(
    await readFile(
        new URL('../../../schemas/v2/egg.schema.json', import.meta.url),
        'utf8'
    )
);

test('Egg v2 uses JSON Schema draft 2020-12 and closed root', () => {
    assert.equal(
        schema.$schema,
        'https://json-schema.org/draft/2020-12/schema'
    );

    assert.equal(schema.properties.schemaVersion.const, 2);
    assert.equal(schema.additionalProperties, false);
});

test('Egg v2 separates seven modules', () => {
    const modules = [
        'metadata',
        'runtime',
        'source',
        'network',
        'storage',
        'lifecycle',
        'variables'
    ];

    for (const module of modules) {
        assert.ok(
            schema.required.includes(module),
            `Missing required module: ${module}`
        );

        assert.ok(
            schema.properties[module],
            `Missing schema property: ${module}`
        );
    }
});

test('Egg v2 requires pinned container images', () => {
    const image = schema.$defs.image;

    assert.ok(image.required.includes('reference'));
    assert.match(image.properties.reference.pattern, /sha256/);
});

test('Egg v2 models source integrity and network protocols', () => {
    const source = schema.$defs.source;
    const port = schema.$defs.port;

    assert.ok(source.properties.sha256);

    assert.deepEqual(
        port.properties.protocol.enum,
        ['tcp', 'udp']
    );

    assert.ok(schema.allOf.length >= 2);
});

test('Egg v2 uses executable and argv rather than shell commands', () => {
    const process = schema.$defs.process;

    assert.deepEqual(
        process.required,
        ['executable', 'args']
    );

    assert.equal(process.additionalProperties, false);
    assert.equal(process.properties.command, undefined);
});
