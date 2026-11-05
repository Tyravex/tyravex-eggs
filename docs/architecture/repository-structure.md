# Repository Structure

## Current published structure

```text
.github/workflows/validate.yml     CI validation
README.md                          Project entry point
registry.json                      Egg v1 registry
registry.v2.json                   Egg v2 registry
eggs/                              Egg v1 manifests
eggs-v2/                           Egg v2 manifests
schemas/v1/                        v1 JSON Schemas
schemas/v2/                        v2 JSON Schemas
scripts/validate.mjs               v1 validation CLI
scripts/validate-v2.mjs            v2 validation CLI
scripts/validate-registry-v2.mjs   v2 registry validation CLI
scripts/check-schemas.mjs          Schema contract checks
tests/                             Automated tests and fixtures
docs/                              Documentation
```

## Planned modular structure

```text
src/
├── core/
│   ├── validation/
│   ├── registry/
│   ├── catalog/
│   └── security/
└── modules/
    └── minecraft/
        └── vanilla/
```

The `src/` layout is proposed, not yet implemented.

## Responsibilities

### Published manifests

Each Egg owns a dedicated folder.

- v1: `eggs/<category>/<slug>/egg.json`
- v2: `eggs-v2/<category>/<slug>/egg.json`

Manifest paths remain stable during modularization.

### Schemas

Versioned contracts live under `schemas/`.

Do not silently change published schema semantics.

### Core modules

Reusable validation, registry, catalog and security logic
will move into `src/core/`.

Core modules must not depend on individual service modules.

### Service modules

Nonprivileged service-specific logic will live under
`src/modules/`.

Minecraft version metadata resolution belongs in the
Minecraft Vanilla module, not in a top-level CLI script.

### CLI

`scripts/` will remain the location of command-line entry
points and compatibility wrappers.

### Tests

Tests will gradually be organized by responsibility while
preserving the existing test suite and fixtures.

## Official catalog

The published v1 and v2 registries are the current catalog
indexes.

A future versioned catalog publication format will support
the Tyravex Panel's official Egg browser.

The Panel owns local persistence, import approval, custom
definitions and update workflows.

## Migration rules

1. Preserve existing manifest and registry paths.
2. Preserve current CLI entry points.
3. Keep npm run validate, npm run test and npm run check working.
4. Do not create speculative empty directories.
5. Move implementation logic incrementally.
6. Run all tests after every migration step.
7. Keep Panel, Agent and Plugins implementation code outside
   this repository.

See [Tyravex Eggs architecture](tyravex-eggs.md).
