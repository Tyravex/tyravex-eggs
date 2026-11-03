# Mandatory module rules

1. One Egg, one folder: `eggs/<category>/<slug>/egg.json`.
2. The registry references every Egg exactly once; metadata must match the manifest.
3. Treat Eggs as untrusted data. Never allow arbitrary host commands, Docker socket access or host mounts in manifests.
4. Keep schemas versioned. Do not silently change v1 semantics; introduce v2 for incompatible changes.
5. Avoid implementation details of Panel, Agent or Plugins in this repository.
6. No secrets, tokens, credentials or user code in commits.
7. Every change must pass `npm run validate`; include tests for new validator behavior.
8. No speculative scaffolding or empty directories.
9. Keep documentation synchronized with changes to manifests or contracts.
10. Use focused commits and review changes before publishing.
