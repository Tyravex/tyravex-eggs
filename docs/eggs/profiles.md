# Egg profiles (v1 extension)

Profiles are presets **inside** an Egg, not separate Eggs. `defaultProfile` identifies one of `profiles[].id`. A profile has `id`, `name`, `startup`, and optional `runtimeVersion`.

Startup modes: `npm-start` (runs the package's start script) or `node-file` (runs an entrypoint such as `bot.js`). The entrypoint is a relative JavaScript path, not a shell command. The Panel may later allow users to override the entrypoint within the service directory.

`runtime.versions` lists allowed Node.js major versions and their image references; `runtime.defaultVersion` selects the default and its image must match the legacy `runtime.image` field. Profiles may suggest one listed version.

Existing v1 Eggs without `profiles` or `runtime.versions` remain valid. Source import (GitHub/ZIP) belongs to Panel service configuration, **not** the Egg profile.

Security: These manifests are declarative only. Runtime image tags here are **catalog hints**, not a secure execution lock. Before production, Panel/Agent must resolve approved images to immutable digests, enforce isolated install/runtime, validate user overrides, and never execute shell strings from manifests. A DBM profile is a starting preset, not a guarantee of compatibility with every DBM project or mod.
