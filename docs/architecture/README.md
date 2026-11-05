# Tyravex Eggs — Architecture Overview

Tyravex Eggs is a versioned, declarative service catalog.

The repository contains no Panel backend, Agent runtime or
privileged Docker orchestration implementation.

## Architecture documents

- [Complete architecture](tyravex-eggs.md)
- [Repository structure](repository-structure.md)
- [Module rules](module-rules.md)

## Ecosystem responsibilities

### Eggs repository

Publishes service manifests, registries, versioned schemas
and validation tooling.

### Tyravex Panel

Will provide an administrative Eggs page for browsing the
official catalog, importing definitions, managing local
versions, creating custom Eggs and approving updates.

The Panel must validate imported definitions and retain
their source and content digest.

### Tyravex Agent

Will perform only authorized provisioning and lifecycle
operations using independently validated contracts.

### Tyravex Plugins

Remains a separate subsystem from Eggs.

## Current status

The repository supports v1 and v2 manifest validation.

The Minecraft Java Vanilla v2 Egg is declarative and is not
yet a complete installer.

Official catalog browsing, Panel imports and automatic
updates are planned, not implemented.

## Security boundary

An Egg is untrusted declarative data.

Importing an Egg does not authorize host execution.
The Panel and Agent must each enforce their own validation
and authorization boundaries.
