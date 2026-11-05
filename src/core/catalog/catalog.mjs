import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateRegistryV1 } from '../registry/registry-v1.mjs';
import { validateRegistryV2 } from '../registry/registry-v2.mjs';

const repositoryRoot = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../..'
);

const registries = [
    { formatVersion: 1, filename: 'registry.json' },
    { formatVersion: 2, filename: 'registry.v2.json' }
];

export class CatalogError extends Error {
    constructor(code, message, options = {}) {
        super(message, { cause: options.cause });

        this.name = 'CatalogError';
        this.code = code;
        this.details = Object.freeze([...(options.details ?? [])]);
    }
}

export async function loadCatalog(rootDir = repositoryRoot) {
    const root = resolve(rootDir);

    let v1;
    let v2;

    try {
        [v1, v2] = await Promise.all([
            validateRegistryV1(root),
            validateRegistryV2(root)
        ]);
    } catch (error) {
        throw new CatalogError(
            'VALIDATION_FAILED',
            'Egg catalog validation failed',
            { cause: error, details: [error.message] }
        );
    }

    const errors = [
        ...v1.errors.map(error => `v1: ${error}`),
        ...v2.errors.map(error => `v2: ${error}`)
    ];

    if (!v1.valid || !v2.valid) {
        throw new CatalogError(
            'VALIDATION_FAILED',
            'Egg catalog validation failed',
            { details: errors }
        );
    }

    const entries = [];
    const seenIds = new Set();

    try {
        for (const registry of registries) {
            const content = JSON.parse(
                await readFile(join(root, registry.filename), 'utf8')
            );

            for (const egg of content.eggs) {
                if (seenIds.has(egg.id)) {
                    throw new CatalogError(
                        'VALIDATION_FAILED',
                        'Egg catalog validation failed',
                        {
                            details: [
                                `Duplicate Egg ID across catalog: ${egg.id}`
                            ]
                        }
                    );
                }

                seenIds.add(egg.id);

                entries.push(Object.freeze({
                    id: egg.id,
                    name: egg.name,
                    description: egg.description,
                    category: egg.category,
                    version: egg.version,
                    formatVersion: registry.formatVersion,
                    path: egg.path
                }));
            }
        }
    } catch (error) {
        if (error instanceof CatalogError) {
            throw error;
        }

        throw new CatalogError(
            'READ_FAILED',
            'Egg catalog could not be read',
            { cause: error }
        );
    }

    entries.sort((a, b) => a.id.localeCompare(b.id));

    return Object.freeze(entries);
}

export function findEgg(catalog, id) {
    return catalog.find(egg => egg.id === id) ?? null;
}

export function filterEggs(catalog, filters = {}) {
    const { category, formatVersion } = filters;

    return Object.freeze(
        catalog.filter(egg =>
            (category === undefined || egg.category === category) &&
            (
                formatVersion === undefined ||
                egg.formatVersion === formatVersion
            )
        )
    );
}
