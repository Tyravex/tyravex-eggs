# Architecture

Tyravex Eggs is a **data-only catalog**. The repository does not contain a Panel backend, an Agent runtime, or executable Docker orchestration code.

1. The catalog lists Egg identifiers, versions and paths.
2. Each Egg describes an approved runtime, install mode, startup mode and input variables.
3. Tyravex Panel must independently validate, authorize and persist the selected definition/version.
4. Tyravex Agent must independently validate commands and execute only supported operations in managed containers.

The first format is intentionally narrow (Node.js + npm) to avoid arbitrary shell execution. See [format v1](../eggs/format-v1.md).
