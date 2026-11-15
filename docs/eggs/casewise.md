# CaseWise Discord bot

Definition: [`eggs/bots/discord-casewise/egg.json`](../../eggs/bots/discord-casewise/egg.json), catalog ID `tyravex.discord.casewise`, version `1.0.0`.

## Project selection

- Repository: `https://github.com/ZabKoz/CaseWise`.
- Reference: `Master` (case-sensitive); resolve and save a specific commit before installation.
- Project directory: `bot`.
- Profile: `casewise`; runtime: Node.js 22 (`node:22-bookworm-slim`).
- Dependency installer: npm, using the project's lockfile when present.
- Startup: `node src/index.js`. The bot package does not define an npm start script.

Keep repository selection in service configuration; it is not an arbitrary installer shell command or a credential stored in this manifest. The source project and npm lifecycle scripts execute inside the service container. Review the pinned project and dependency changes before installation. This Egg contains no bot code.

## Variables and Discord prerequisites

- `TOKEN`: required secret, Discord bot token. Enter through the Panel secret/environment editor.
- `MONGO_URI`: required secret, connection URI for an existing MongoDB database and its dedicated limited-privilege account. No example real URI or database credential is included.
- `DEVELOPERMODE`: optional string interpreted by the application; this Egg does not set its value.

Enable the privileged Server Members and Message Content gateway intents used by the bot in the Discord application configuration. Invite the bot to a test guild with the permissions required by its commands. Do not grant Discord Administrator permission by default.

## Test preparation

1. Synchronize the official registry in the Panel, then review, approve and enable this Egg. Synchronization alone does not install a service or approve source code.
2. Create a separate Discord test service with an owner and an assigned online node. Select this Egg and project configuration above.
3. Start with 512 MB RAM, 100% CPU and 2048 MB persistent storage, then adjust after measuring the actual workload. These are service suggestions, not new fields in the v1 manifest schema.
4. Supply the required secrets when MongoDB is available. Database provisioning is a separate service concern; this Egg neither creates a database nor embeds a MongoDB container.
5. Check installation readiness and queue the installation. The compatible Agent must support public Git installation, authenticated secret delivery, persistent volumes and monitored-stop storage limits.
6. Verify the container process, bot login, test-guild behavior, MongoDB connectivity, stop/start and retained data. A completed process-start job alone does not prove application-level readiness.

If MongoDB is not prepared, leave its URI unset and complete catalog/import/contract tests first. The required variable check intentionally blocks full installation rather than reporting a working bot without its dependency. No inbound public bot port is needed. Allow outbound HTTPS/Discord gateway connections and access to the selected database.

## Database integration recommendation

A future database module should manage MongoDB instances separately and attach a dedicated database/account to each application service. Use private networking, generated credentials, encrypted secret delivery, independently tested backups and controlled credential rotation. Avoid exposing the database port publicly or placing administrator credentials in the bot environment. Sharing an instance must not share application database privileges.
