# Tyravex Eggs

Official, versioned service definitions for Tyravex Panel. Eggs describe **configuration**, not privileged executable plugins.

> **Status:** Versioned manifests require a compatible Panel and Go Agent runtime contract. Publishing an Egg does not deploy or start a service.

## Quick start

Requires Node.js 20+ (Node.js 22 recommended).

```bash
npm run validate
```

## Layout

- [`registry.json`](registry.json) — catalog index
- [`profiles/`](profiles/) - application authoring metadata
- [`applications.json`](applications.json) - application discovery index
- [`eggs/`](eggs/) — one service definition per directory
- [`schemas/v1/`](schemas/v1/) — versioned JSON Schema contracts
- [`scripts/`](scripts/) — repository tooling
- [`docs/`](docs/README.md) — architecture, format, security, contributing

## Service guides

- [Application catalog and profiles](docs/eggs/profiles.md)
- [Application index](applications.json): 17 projects with explicit availability and requirements.

## Related projects

- [Tyravex Panel](https://github.com/Tyravex/panel)
- [Tyravex Agent](https://github.com/Tyravex/agent)
- [Tyravex Plugins](https://github.com/Tyravex/tyravex-plugins)

## License

GPL-3.0; see [LICENSE](LICENSE).
