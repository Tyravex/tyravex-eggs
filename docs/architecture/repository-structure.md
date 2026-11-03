# Repository structure

```text
.github/workflows/validate.yml  CI validation
README.md                       Entry point
CONTRIBUTING.md                 Contribution guide
SECURITY.md                     Vulnerability reporting
CHANGELOG.md                    Change history
registry.json                   Published catalog index
schemas/v1/                     Immutable v1 JSON Schemas
eggs/<category>/<slug>/egg.json One Egg per service folder
scripts/validate.mjs            Dependency-free validator
docs/                           Architecture and authoring guides
```

No speculative empty directories. A new Egg owns its own directory. Shared schema and validation rules stay outside individual Eggs. Do not duplicate backend, Agent or plugin SDK code here.
