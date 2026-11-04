# Contract tests and validation

## Local checks

From the repository root:

```powershell
npm.cmd run check
```

This runs the existing registry/Egg validator, a small schema contract check, and isolated negative-case tests. No dependency installation is required.

## What is covered

- Valid registry and manifest
- Duplicate IDs, paths and environment variable names
- Path traversal rejection and unregistered manifests
- Registry/manifest metadata mismatches
- Unsupported installation modes and unexpected startup commands
- Unknown manifest properties
- Basic invariants for both JSON Schema v1 files

## Important limitation

The schema check verifies selected contract invariants, **not full JSON Schema Draft 2020-12 validation**. The existing runtime validator remains authoritative for this experimental registry until a full schema validator is integrated. The tests do not prove Docker image safety, Agent execution security, or deployability.

## Adding tests

Add test cases in `tests/validate.test.mjs`. Each test creates an isolated temporary repository fixture and invokes `scripts/validate.mjs` with Node.js. Tests must not mutate the working repository.
