# Egg format v1

**Status:** Experimental contract; not deployable yet.

`schemaVersion` is `1`. Every Egg has `id`, `name`, `description`, `version`, `category`, `runtime`, `install`, `startup` and `variables`.

- **id:** stable dotted identifier (example: `tyravex.discord.nodejs`).
- **version:** three-part numeric release version. Immutable once published.
- **category:** `bots`, `games`, `applications`.
- **runtime:** `docker`, image reference, fixed `/app` working directory.
- **install:** currently only `nodejs` + `npm`; future versions may add additional modes.
- **startup:** currently only `npm-start`.
- **variables:** typed user inputs; `secret` values must be redacted in all logs.

No shell command field is allowed. `npm-start` is an abstract mode; the Agent implementation must explicitly enforce allowed behavior. The first Egg assumes user-provided project files containing `package.json`, `package-lock.json` and an npm `start` script. Source acquisition, image digest pinning, sandboxing and secret delivery remain future Panel/Agent responsibilities.

The JSON Schema files in `schemas/v1/` are machine-readable contracts. The zero-dependency `npm run validate` command performs matching structural checks and registry consistency checks; it is **not** a full JSON Schema implementation.
