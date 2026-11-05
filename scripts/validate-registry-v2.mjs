import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateEggV2 } from './validate-v2.mjs';

const repositoryRoot = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..'
);

const schema = JSON.parse(
    await readFile(
        resolve(repositoryRoot, 'schemas/v2/registry.schema.json'),
        'utf8'
    )
);

const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: false
});

const validateSchema = ajv.compile(schema);

const safePath =
    /^eggs-v2\/(bots|games|applications)\/[a-z0-9-]+\/egg\.json$/;

async function readJson(path) {
    return JSON.parse(await readFile(path, 'utf8'));
}

async function assertNoSymlinks(root, relativePath) {
    let current = root;

    for (const part of relativePath.split('/')) {
        current = join(current, part);
        const info = await lstat(current);

        if (info.isSymbolicLink()) {
            throw new Error(`symbolic link is forbidden: ${relativePath}`);
        }
    }

    const info = await lstat(current);

    if (!info.isFile()) {
        throw new Error(`not a regular file: ${relativePath}`);
    }
}

async function discoverManifests(root, errors) {
    const found = [];
    const base = resolve(root, 'eggs-v2');

    let info;

    try {
        info = await lstat(base);
    } catch (error) {
        if (error.code === 'ENOENT') return found;
        throw error;
    }

    if (info.isSymbolicLink() || !info.isDirectory()) {
        errors.push('eggs-v2: expected a real directory');
        return found;
    }

    async function walk(directory, relative) {
        const items = await readdir(directory, { withFileTypes: true });

        for (const item of items) {
            const nextRelative = relative
                ? `${relative}/${item.name}`
                : item.name;

            const nextPath = join(directory, item.name);

            if (item.isSymbolicLink()) {
                errors.push(`eggs-v2/${nextRelative}: symbolic link forbidden`);
            } else if (item.isDirectory()) {
                await walk(nextPath, nextRelative);
            } else if (item.isFile() && item.name === 'egg.json') {
                found.push(`eggs-v2/${nextRelative}`);
            }
        }
    }

    await walk(base, '');

    return found;
}

export async function validateRegistryV2(
    rootDir = repositoryRoot
) {
    const root = resolve(rootDir);
    const errors = [];
    let registry;

    try {
        registry = await readJson(resolve(root, 'registry.v2.json'));
    } catch (error) {
        return {
            valid: false,
            count: 0,
            errors: [`registry.v2.json: ${error.message}`]
        };
    }

    if (!validateSchema(registry)) {
        for (const error of validateSchema.errors ?? []) {
            errors.push(
                `registry.v2.json${error.instancePath}: ${error.message}`
            );
        }

        return {
            valid: false,
            count: 0,
            errors
        };
    }

    let legacyRegistry;

    try {
        legacyRegistry = await readJson(resolve(root, 'registry.json'));

        if (
            legacyRegistry.schemaVersion !== 1 ||
            !Array.isArray(legacyRegistry.eggs) ||
            legacyRegistry.eggs.some(
                entry => !entry || typeof entry.id !== 'string'
            )
        ) {
            throw new Error('invalid v1 registry structure');
        }
    } catch (error) {
        errors.push(`registry.json: ${error.message}`);

        return {
            valid: false,
            count: registry.eggs.length,
            errors
        };
    }

    const legacyIds = new Set(
        legacyRegistry.eggs.map(entry => entry.id)
    );

    const ids = new Set();
    const paths = new Set();

    for (const [index, entry] of registry.eggs.entries()) {
        const where = `registry.v2.json.eggs[${index}]`;

        if (ids.has(entry.id)) {
            errors.push(`${where}: duplicate id ${entry.id}`);
        }

        ids.add(entry.id);

        if (legacyIds.has(entry.id)) {
            errors.push(`${where}: id conflicts with v1: ${entry.id}`);
        }

        if (paths.has(entry.path)) {
            errors.push(`${where}: duplicate path ${entry.path}`);
        }

        paths.add(entry.path);

        if (!safePath.test(entry.path)) {
            errors.push(`${where}: unsafe path`);
            continue;
        }

        const pathCategory = entry.path.split('/')[1];

        if (pathCategory !== entry.category) {
            errors.push(`${where}: path category mismatch`);
        }

        try {
            await assertNoSymlinks(root, entry.path);

            const egg = await readJson(resolve(root, entry.path));
            const result = validateEggV2(egg);

            if (!result.valid) {
                for (const error of result.errors) {
                    errors.push(
                        `${entry.path} ${error.path}: ${error.message}`
                    );
                }

                continue;
            }

            for (const field of [
                'id',
                'name',
                'description',
                'version',
                'category'
            ]) {
                if (entry[field] !== egg.metadata[field]) {
                    errors.push(
                        `${where}: ${field} does not match manifest`
                    );
                }
            }
        } catch (error) {
            errors.push(
                `${where}: cannot read manifest: ${error.message}`
            );
        }
    }

    try {
        const discovered = await discoverManifests(root, errors);

        for (const path of discovered) {
            if (!paths.has(path)) {
                errors.push(`${path}: not listed in v2 registry`);
            }

            if (!safePath.test(path)) {
                errors.push(`${path}: invalid manifest location`);
            }
        }
    } catch (error) {
        errors.push(`eggs-v2: cannot scan directory: ${error.message}`);
    }

    return {
        valid: errors.length === 0,
        count: registry.eggs.length,
        errors
    };
}

async function main() {
    const result = await validateRegistryV2();

    if (result.valid) {
        console.log(
            `OK: ${result.count} Egg(s) validated (registry v2)`
        );
        return;
    }

    for (const error of result.errors) {
        console.error(`ERROR ${error}`);
    }

    process.exitCode = 1;
}

const invokedDirectly =
    process.argv[1] &&
    import.meta.url === pathToFileURL(
        resolve(process.argv[1])
    ).href;

if (invokedDirectly) {
    await main();
}