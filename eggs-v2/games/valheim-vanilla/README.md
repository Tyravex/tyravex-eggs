# Valheim Vanilla

Install app 896660 anonymously through SteamCMD. The only supported platform is Linux amd64 containers, including Docker Desktop with Linux containers.

Requires panel and agent capability `service.steamcmd.valheim.v1`. Egg schema validation alone does not establish execution support.

Set VALHEIM_NAME, VALHEIM_WORLD and VALHEIM_PASSWORD through the panel. The password must have 5–64 characters and must not occur in the server name. World names use letters, digits, underscores and hyphens. Secrets are not part of the Egg. The first variant is private (`-public 0`) and Steam-only; crossplay and mods are not enabled.

The panel allocates two consecutive UDP host ports. Container ports are 2456 and 2457. Host firewall/NAT rules remain the host administrator's responsibility.

Files: /app/project (Steam installation), /app/project/saves (worlds and permission lists), /app/.steamcmd and /app/.steam-home (Steam state). Backups must include /app/project/saves. No automatic update runs on restart. Stop uses SIGINT with a 120-second grace period; Kill can lose unsaved progress.

Recommended starting allocation: 4096 MiB RAM, 100% CPU, 10240 MiB disk. Disk enforcement uses monitoring and stop; it is not a hard filesystem quota.

Official server guide: https://www.valheimgame.com/support/a-guide-to-dedicated-servers/
