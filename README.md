# Tyravex Eggs

Official, versioned service definitions for Tyravex Panel. Eggs describe **configuration**, not privileged executable plugins.

> **Status:** Experimental format v1. No Egg is deployable until Panel and Go Agent implement and validate the runtime contract.

## Quick start

Requires Node.js 20+ (Node.js 22 recommended).

```bash
npm run validate
```

## Layout

- [`registry.json`](registry.json) — catalog index
- [`eggs/`](eggs/) — one service definition per directory
- [`schemas/v1/`](schemas/v1/) — versioned JSON Schema contracts
- [`scripts/`](scripts/) — repository tooling
- [`docs/`](docs/README.md) — architecture, format, security, contributing

## Related projects

- [Tyravex Panel](https://github.com/Tyravex/panel)
- [Tyravex Agent](https://github.com/Tyravex/agent)
- [Tyravex Plugins](https://github.com/Tyravex/tyravex-plugins)

## License

GPL-3.0; see [LICENSE](LICENSE).
