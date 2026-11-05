import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

const schemaUrl = new URL(
    '../../../schemas/v2/egg.schema.json',
    import.meta.url
);

const schema = JSON.parse(
    await readFile(schemaUrl, 'utf8')
);

const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: false
});

const validateSchema = ajv.compile(schema);

function duplicateValues(values) {
    const seen = new Set();
    const duplicates = new Set();

    for (const value of values) {
        if (seen.has(value)) duplicates.add(value);
        seen.add(value);
    }

    return [...duplicates];
}

export function validateEggV2(egg) {
    const errors = [];

    if (!validateSchema(egg)) {
        for (const error of validateSchema.errors ?? []) {
            errors.push({
                path: error.instancePath || '/',
                message: error.message || 'invalid value'
            });
        }

        return { valid: false, errors };
    }

    const groups = [
        ['network.ports', egg.network.ports, item => item.name],
        ['storage.mounts', egg.storage.mounts, item => item.name],
        ['variables', egg.variables, item => item.name]
    ];

    for (const [path, items, getName] of groups) {
        for (const name of duplicateValues(items.map(getName))) {
            errors.push({
                path,
                message: `duplicate name: ${name}`
            });
        }
    }

    const portKeys = egg.network.ports.map(
        port => `${port.protocol}:${port.containerPort}`
    );

    for (const key of duplicateValues(portKeys)) {
        errors.push({
            path: 'network.ports',
            message: `duplicate protocol/containerPort: ${key}`
        });
    }

    const mountPaths = egg.storage.mounts.map(
        mount => mount.containerPath
    );

    for (const path of duplicateValues(mountPaths)) {
        errors.push({
            path: 'storage.mounts',
            message: `duplicate containerPath: ${path}`
        });
    }

    return { valid: errors.length === 0, errors };
}

export async function validateEggV2File(path) {
    const egg = JSON.parse(await readFile(path, 'utf8'));
    return validateEggV2(egg);
}
