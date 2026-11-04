# Tyravex Egg v2 — draft

Status: **draft, contract only**. Egg v1, its registry, validator and six existing manifests remain unchanged.

## Modular structure

The manifest separates `metadata`, `runtime`, `source`, `network`, `storage`, `lifecycle` and `variables`. The JSON Schema uses reusable `$defs` for each component. These are **logical modules within one manifest**, not dynamically loaded plugins. Future implementations may split schemas into separate files, but this draft is self-contained.

| Module | Responsibility |
|---|---|
| `metadata` | identity, version, category |
| `runtime` | pinned Docker image digest and working directory |
| `source` | no source or HTTPS archive with SHA-256 |
| `network` | named TCP/UDP container ports |
| `storage` | named persistent mount points |
| `lifecycle` | executable and argument vector; no shell command string |
| `variables` | string/secret declarations |

## Security contract and implementation requirements

- A digest-pinned image is required, but pinning alone does not guarantee trust. The Panel/Agent must enforce an image allowlist or provenance policy.
- `source.kind=archive` requires `url` and `sha256`. The Agent must verify the digest **before extraction**, reject unsafe paths and links, and enforce extraction size limits. HTTPS is not a substitute for provenance.
- `source.kind=none` forbids URL and digest.
- `lifecycle.start` is an argv-style process description, **not** host shell execution. The Agent must run it inside a restricted container, without privileged mode or arbitrary host mounts.
- Ports are declarations; the Panel must allocate host ports, check collisions and authorize exposure. Do not treat `containerPort` as a host port.
- Storage paths are container destinations. The Agent must own the host-side volume mapping and reject symlinks, path traversal and reserved paths.
- Variables with `type=secret` must be injected securely, not logged or committed.
- Schema validation checks shape only. Cross-field uniqueness, actual image trust, download security, runtime permissions, healthchecks, updates and backup policies require later specification and enforcement.

## Compatibility

The existing `registry.json` remains v1. Do not register v2 manifests until a version-aware registry, validator and Panel–Agent integration exist. `npm.cmd run check` continues to validate v1 plus these draft contract tests.

## Next steps

1. Add a real JSON Schema 2020-12 validation engine and negative fixtures.
2. Define version-aware registry and migration/compatibility tests.
3. Add source provenance, installation policy, resource limits, healthchecks, backups and update policies.
4. Implement enforcement in Panel and Agent before declaring any v2 Egg deployable.
