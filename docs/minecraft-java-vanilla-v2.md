# Minecraft Java Vanilla — Egg v2

Status: declarative template only. Deployment is not enabled.

## Identity

- ID: `tyravex.minecraft.java.vanilla`
- Category: `games`
- Egg version: `1.0.0`
- Server type: Minecraft Java Edition, Vanilla

The Egg version is not a Minecraft game version.

## Runtime

Uses a digest-pinned Eclipse Temurin Java 21 JRE image.

The image reference is pinned to an OCI digest. The runtime
platform and image provenance must still be checked by the
Panel and Agent before deployment.

Java 21 is not compatible with every Minecraft release.
The selected server JAR must be checked against its Java
requirements.

## Server files

Expected server JAR:

`/data/server.jar`

The manifest does not download or install Minecraft.

A future provisioning mechanism must place a verified,
administrator-approved server JAR at that location.

## Network

- Protocol: TCP
- Container port: 25565

The host port must be allocated and authorized by the Panel.

## Storage

Persistent container directory:

`/data`

This directory is intended for:

- `server.jar`
- `server.properties`
- `eula.txt`
- world data
- server logs

The Agent must control host-side storage mapping.

## Startup

Executable: `java`

Arguments:

`-jar /data/server.jar nogui`

The lifecycle declaration is not a host shell command.

## EULA

Minecraft's EULA must be reviewed and explicitly accepted
by the server administrator before starting the server.

This Egg does not automatically generate `eula.txt`
or set `eula=true`.

## Resource limits

CPU, RAM, disk quotas and container security settings are
not defined by the current Egg v2 schema.

These must be enforced by the Panel and Agent before
deployment support is enabled.

## Security requirements before deployment

- Verify the selected Minecraft server JAR and its origin.
- Check the Minecraft version against the Java version.
- Enforce image trust and platform compatibility.
- Run the container without privileged access.
- Apply CPU, memory, process and disk limits.
- Control storage ownership and filesystem permissions.
- Provide an explicit EULA acceptance workflow.
- Implement backup, graceful shutdown and update policies.
- Avoid exposing RCON unless explicitly configured securely.

Registry inclusion is not permission to execute this Egg.