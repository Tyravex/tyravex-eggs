# Tyravex Eggs — Architecture

Status: Proposed modular architecture
Baseline: main at d70be6f
Scope: Tyravex/tyravex-eggs

## 1. Purpose

Tyravex Eggs is the official, versioned catalog of declarative
service definitions for the Tyravex hosting ecosystem.

The catalog describes supported services. It does not execute
installation commands or manage Docker containers.

The Tyravex ecosystem has four separate responsibilities:

- tyravex-eggs: official catalog and service contracts.
- panel: administration, import, editing, persistence and approval.
- agent: authorized provisioning and container lifecycle.
- tyravex-plugins: independent plugin and extension system.

Egg definitions are data, not privileged executable plugins.

## 2. Current baseline

At commit d70be6f the repository contains:

- Six published Egg v1 manifests.
- One Minecraft Java Vanilla Egg v2 manifest.
- Separate v1 and v2 registries.
- Versioned v1 and v2 JSON Schemas.
- Repository validation scripts and automated tests.

The Minecraft Java Vanilla v2 Egg is declarative only.
It is not a complete installer or deployable server workflow.

## 3. Design principles

1. Contract-first development.
2. Backward compatibility for published definitions.
3. Clear module boundaries.
4. Explicit trust and authorization boundaries.
5. Deterministic, offline automated tests.
6. No arbitrary host shell execution.
7. Stable published manifest and registry paths.
8. Explicit version pinning and change review.
9. No secrets or user workloads in the repository.
10. Incremental migration with passing CI at every step.

## 4. Target repository structure

```text
tyravex-eggs/
├── eggs/                    # Published Egg v1 manifests
├── eggs-v2/                 # Published Egg v2 manifests
├── schemas/
│   ├── v1/
│   └── v2/
├── src/
│   ├── core/
│   │   ├── validation/
│   │   ├── registry/
│   │   ├── catalog/
│   │   └── security/
│   └── modules/
│       └── minecraft/
│           └── vanilla/
├── scripts/                 # Thin CLI entry points
├── tests/
│   ├── core/
│   ├── modules/
│   └── fixtures/
├── docs/
│   ├── architecture/
│   ├── catalog/
│   ├── modules/
│   └── eggs/
├── registry.json
├── registry.v2.json
└── package.json
```

This is a target structure, not the current filesystem layout.

Create module directories only when they contain real code.
Do not introduce empty placeholder directories.

## 5. Module responsibilities

### 5.1 Core validation

`src/core/validation/` will own reusable manifest and schema
validation logic.

It must not depend on Minecraft or any other individual service.

### 5.2 Registry

`src/core/registry/` will own registry consistency checks,
manifest references, identity collisions and safe path rules.

The v1 and v2 registries remain separate.

### 5.3 Catalog

`src/core/catalog/` will own catalog-specific data processing
and publication tooling.

Its future responsibilities may include:

- Producing a normalized catalog index.
- Exposing category and version metadata.
- Validating catalog publication artifacts.
- Calculating hashes of published definitions.
- Supporting reproducible catalog releases.

This repository does not implement Panel HTTP endpoints.

### 5.4 Security

`src/core/security/` will contain reusable security-oriented
validation helpers when needed.

Security checks in this repository do not replace authorization
and isolation checks in Panel or Agent.

### 5.5 Service modules

`src/modules/` will contain service-specific, nonprivileged
logic such as official version metadata resolution.

Example:

`src/modules/minecraft/vanilla/metadata.mjs`

Service modules must not execute host commands, create Docker
containers or write to arbitrary host filesystem paths.

### 5.6 Scripts

`scripts/` will contain command-line entry points.

Existing CLI paths should remain available as compatibility
wrappers while implementation logic moves into modules.

## 6. Egg v2 contract

Egg v2 currently has seven logical sections:

- metadata
- runtime
- source
- network
- storage
- lifecycle
- variables

These are sections of one declarative manifest contract.
They are not independently executable modules or plugins.

The JSON Schema and semantic validation rules define the
supported manifest behavior.

## 7. Official catalog distribution

The official catalog is published by the Tyravex project.

Initial source:

https://github.com/Tyravex/tyravex-eggs

The existing registry files are the current catalog indexes:

- registry.json for v1.
- registry.v2.json for v2.

A future normalized catalog API or generated index must be
introduced as a separately versioned contract.

The Panel must not depend on GitHub's directory layout beyond
the documented published paths.

### 7.1 Catalog discovery

The Panel backend retrieves catalog metadata from an explicitly
configured and trusted official source.

The backend must:

1. Retrieve a bounded catalog response.
2. Validate its schema and supported version.
3. Validate referenced manifest paths.
4. Retrieve selected manifest bytes.
5. Validate the manifest and registry consistency.
6. Record the exact source revision and content digest.
7. Present the definition to an authorized administrator.

Catalog discovery must not automatically install or execute Eggs.

### 7.2 Trust and integrity

HTTPS transport and a content digest are necessary but do not
independently prove publisher authenticity.

A SHA-256 digest calculated from downloaded bytes identifies
those bytes; it does not authenticate an untrusted publisher.

A production trust policy must define how the Panel recognizes
approved catalog revisions, for example through trusted signed
releases or another explicitly authenticated publication process.

Do not describe an arbitrary GitHub commit or branch name as a
cryptographic trust guarantee.

### 7.3 Version pinning

A locally imported Egg should retain:

- Egg ID.
- Manifest schema version.
- Egg definition version.
- Source type and source identifier.
- Source repository and immutable revision when applicable.
- SHA-256 of the exact imported manifest bytes.
- Import timestamp.
- Local approval and deployment status.

The exact database model belongs to the Panel repository.

## 8. Panel Eggs management

The Tyravex Panel will provide an administrative Eggs section.

Planned views:

### Official Catalog

Browse, search and filter officially published definitions.

Display category, schema version, Egg version, source revision,
compatibility and deployment-readiness information.

### Installed Eggs

Show definitions already imported into the Panel's local
library, including their pinned versions and update status.

### Custom Eggs

Allow authorized administrators to create, edit and import
custom definitions.

Custom Eggs must not automatically receive official status.

### Egg Details

Display:

- Identity and description.
- Schema and definition versions.
- Runtime image and digest.
- Network and storage requirements.
- Variables and secret declarations.
- Lifecycle definition.
- Source and integrity information.
- Validation errors and warnings.
- Differences between available versions.

### Import and Updates

The Panel must validate before accepting an Egg.

Updates require review of relevant changes and explicit
administrator approval.

An update to the official catalog must not silently change
the definition pinned to an existing server.

## 9. Panel and Agent boundaries

The Panel is responsible for:

- Authentication and authorization.
- Catalog retrieval and trust policy.
- Validation and local persistence.
- Import, editing and approval workflows.
- Selection of a pinned Egg definition for deployment.

The Agent is responsible for:

- Independently validating supported operations.
- Controlled installation and provisioning.
- Container image handling and isolation.
- Resource limits and filesystem boundaries.
- Network configuration and lifecycle management.
- Secret delivery through approved mechanisms.

The Agent must not trust a manifest solely because the Panel
claims it came from the official catalog.

## 10. Deployment readiness

Catalog presence does not imply deployability.

The future Panel should distinguish at least:

- template: valid definition, but installation is incomplete.
- ready: required deployment contract has been implemented.
- deprecated: retained for compatibility, not recommended.

Readiness is separate from Egg schema version and definition
version.

The existing Minecraft Java Vanilla v2 Egg is a template.

Readiness metadata must be introduced through a reviewed,
versioned catalog contract rather than added as an
undocumented field to existing manifests.

## 11. Compatibility guarantees

During initial modularization preserve:

- registry.json
- registry.v2.json
- eggs/**/egg.json
- eggs-v2/**/egg.json
- schemas/v1/
- schemas/v2/

Preserve working commands:

- npm run validate
- npm run test
- npm run check

Preserve existing CLI script entry points while extracting
their internal logic.

Do not silently change published Egg IDs, versions, paths
or manifest semantics.

## 12. Migration plan

### Phase A: Documentation

Introduce this architecture and update documentation indexes.

No runtime or validation behavior changes.

### Phase B: Core extraction

Move reusable validation and registry logic into src/core/.

Keep compatibility wrappers in scripts/.

### Phase C: Test organization

Group tests by module while preserving existing coverage.

Update test discovery carefully.

### Phase D: Minecraft module

Introduce Minecraft metadata resolution under
src/modules/minecraft/vanilla/.

Use injected network dependencies and offline tests.

### Phase E: Catalog publication contract

Design and test a versioned, reproducible catalog artifact
that the Panel can consume.

Do not build Panel-specific backend code in this repository.

### Phase F: Panel integration

Implement the official catalog browser, local Egg library,
custom Egg editor and update workflow in the Panel repository.

### Phase G: Agent integration

Implement the approved provisioning and runtime contract in
the Agent repository.

## 13. Quality gates

Every implementation phase must pass:

- Manifest and registry validation.
- Existing v1 and v2 tests.
- New module-specific tests.
- Dependency audit.
- Git whitespace checks.
- GitHub Actions.

Refactoring must not reduce existing validation coverage.

## 14. Current limitations

The current repository does not yet implement:

- A production Minecraft installer.
- A published catalog API contract.
- A trusted signed catalog release process.
- The Panel Eggs management interface.
- Automatic Egg updates.
- The Panel-to-Agent deployment contract.
- Production container resource enforcement.

These are planned capabilities, not completed features.

## 15. Related projects

- https://github.com/Tyravex/panel
- https://github.com/Tyravex/agent
- https://github.com/Tyravex/tyravex-plugins
