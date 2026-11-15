# Egg profiles (v1 extension)

Profiles are presets **inside** an Egg, not separate Eggs. `defaultProfile` identifies one of `profiles[].id`. A profile has `id`, `name`, `startup`, and optional `runtimeVersion`.

Startup modes: `npm-start` (runs the package's start script) or `node-file` (runs an entrypoint such as `bot.js`). The entrypoint is a relative JavaScript path, not a shell command. The Panel may later allow users to override the entrypoint within the service directory.

`runtime.versions` lists allowed Node.js major versions and their image references; `runtime.defaultVersion` selects the default and its image must match the legacy `runtime.image` field. Profiles may suggest one listed version.

Existing v1 Eggs without `profiles` or `runtime.versions` remain valid. Source import belongs to service configuration. Application profiles may suggest a public Git repository; selecting a profile alone must not download or execute it.

Security: These manifests are declarative only. Runtime image tags here are **catalog hints**, not a secure execution lock. Before production, Panel/Agent must resolve approved images to immutable digests, enforce isolated install/runtime, validate user overrides, and never execute shell strings from manifests. A DBM profile is a starting preset, not a guarantee of compatibility with every DBM project or mod.

## Application profiles

An optional `application` object adds a description, author, upstream version/ref, public GitHub `repositoryUrl`, `reference`, `subdirectory`, and optional human-readable `requirements`. These fields are source suggestions, never executable installer commands. Saving service configuration resolves the chosen ref to an immutable Git commit.

Optional profile `variables` use `{ name, required, secret }`. They **replace**, rather than merge with, Egg-level declarations. An empty list deliberately requires no environment variables. Omitting the field retains legacy Egg variables. Changing a saved service profile clears its stored environment, including secrets.

Author application presets under `profiles/<category>/<platform>/<application>.json` with `{ application }` for previews or `{ application, eggId, profile }` for installable presets, then run `npm run build:profiles` to generate `applications.json` and embed installable profiles in their target Eggs. Bump the affected Egg and registry version before publishing. `npm run validate` checks schema validity and exact equality, preventing authoring/runtime drift. No user tokens or database URLs belong in presets.


A generic runtime is not proof that an upstream application works. Projects requiring JSON configuration files, interactive setup, native libraries, compilation, ports or licensed downloads need a supported installer before being offered as ready-to-install presets. Do not add unsupported profiles with placeholder startup commands.

## Discovery index and availability

`applications.json` indexes all 17 requested third-party projects. Each entry has its own file under `profiles/bots/<platform>/`. `INSTALLABLE` means that an installer contract and a matching embedded Egg profile are provided; it does not mean that a real Discord/Twitch login has been tested. The Panel must still require approval/enabling, service category compatibility, live Agent capabilities, resource limits and application credentials. `PREVIEW` entries describe missing support and cannot contain executable profiles.

Dynamica is the first Node.js preset. It targets `tyravex.discord.nodejs` 1.2.0, uses a profile-specific pnpm installer, `dist/main.js`, `TOKEN` and `POSTGRES_URL`. An initialized PostgreSQL database is required. Database provisioning/migrations, application login and exposed HTTP ports are not performed by this preset.

The profile `install` override may select npm or pnpm while retaining the parent Egg runtime family. Python profiles retain pip. New Agents advertise the separate pnpm capability; older Agents must not receive pnpm installations. Keep the fixed package-manager recipe and execution policy in the Agent, not in this repository.

PhantomBot is a Java application, not a Node.js bot. CorpBot.py and pixel-bot require file configuration rather than simply an environment token. Redbot needs instance setup. Aoede needs a Rust/native or approved prebuilt-image path and Spotify Premium. Go, Java, TeamSpeak, native/audio dependencies and port allocation require additional installer support before the remaining previews become executable presets.

See each entry's upstream URL and requirements. Do not redistribute third-party program binaries or credentials in this catalog.
