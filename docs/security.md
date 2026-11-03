# Security model

Egg definitions are untrusted configuration, even from the official registry.

- No arbitrary host shell commands or direct Docker socket access.
- Validate manifests and registry paths before use; reject unknown fields and symlinks.
- Panel enforces RBAC, resource quotas and approved images; Agent enforces runtime allowlists again.
- Pin production Docker images by verified digest; `node:22-bookworm-slim` in the sample is a placeholder.
- Isolate workloads with least privilege, restricted mounts, network controls and resource limits.
- Treat user-supplied application code and npm dependencies as untrusted code.
- Never log bot tokens or secrets. Provide them through a secure delivery mechanism.
- Download and install operations must have timeouts and size limits; verify trusted artifacts.
- Never auto-retry uncertain durable install commands without reconciliation.

See [SECURITY.md](../SECURITY.md) for reporting vulnerabilities.
