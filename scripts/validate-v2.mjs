import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = resolve(root, 'schemas/v2/egg.schema.json');

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
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

async function main() {
    const files = process.argv.slice(2);

    if (files.length === 0) {
        console.error(
            'Usage: node scripts/validate-v2.mjs <manifest.json> [...]'
        );
        process.exitCode = 1;
        return;
    }

    let failures = 0;

    for (const file of files) {
        try {
            const result = await validateEggV2File(resolve(file));

            if (result.valid) {
                console.log(`OK: ${file}`);
            } else {
                failures++;
                for (const error of result.errors) {
                    console.error(
                        `ERROR ${file} ${error.path}: ${error.message}`
                    );
                }
            }
        } catch (error) {
            failures++;
            console.error(`ERROR ${file}: ${error.message}`);
        }
    }

    if (failures > 0) process.exitCode = 1;
}

const invokedDirectly = process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
    await main();
}