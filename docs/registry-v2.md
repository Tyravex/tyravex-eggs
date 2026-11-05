# Tyravex Eggs — versioned registry

Status: registry validation only. No Egg v2 deployment support.

## Compatibility

Tyravex maintains two independent registries:

- `registry.json` — existing Egg v1 registry.
- `registry.v2.json` — Egg v2 registry.

The six existing v1 Eggs remain unchanged.

Both registries are validated during `npm run check`.

## Egg v2 registry format

The registry contains:

- `schemaVersion`: must be `2`.
- `eggs`: array of manifest references.

Each entry requires:

- `id`
- `name`
- `description`
- `category`
- `version`
- `path`

All metadata must match the referenced Egg v2 manifest.

## Manifest locations

Egg v1 manifests remain under `eggs/`.

Egg v2 manifests must use:

`eggs-v2/<category>/<slug>/egg.json`

Allowed categories:

- `bots`
- `games`
- `applications`

The v2 registry validator rejects:

- invalid registry structure;
- unsupported schema versions;
- duplicate IDs and paths;
- IDs already registered in v1;
- path traversal and unexpected paths;
- symbolic links in manifest paths;
- mismatched registry and manifest metadata;
- invalid Egg v2 manifests;
- unregistered Egg v2 manifests.

## Current status

`registry.v2.json` initially contains an empty `eggs` array.

The v2 fixture in `tests/fixtures/v2/` is for validation tests
only. Its image digest is synthetic and must not be treated as
a deployable image.

Do not register fixtures as production Eggs.

## Validation

Run:

`npm run check`

Or validate the v2 registry independently:

`node scripts/validate-registry-v2.mjs`

The validator reads manifests and metadata. It does not install
packages, download sources, allocate ports, create volumes,
or start containers.

## Future work

Before v2 deployment is enabled:

1. Establish image provenance and trusted digest policies.
2. Add secure source download and extraction rules.
3. Define resource limits and runtime isolation.
4. Define healthchecks, backups and update policies.
5. Implement Panel and Agent enforcement.
6. Add explicit registry migration and compatibility policies.

Registry inclusion is not authorization to execute an Egg.
