# Development

## Requirements

Node.js 20+ and npm. The validator uses only built-in Node.js modules; `npm install` is not required.

## Validate

```bash
npm run validate
```

The validator checks manifest shape, supported v1 modes, duplicate IDs, registry consistency, paths and unregistered Eggs. It is not a substitute for Agent integration tests, image verification or a full JSON Schema validator.

## Release policy

Until the v1 contract is stabilized, do not assume the sample Egg is installable. Freeze published versions, review changes and test Panel/Agent compatibility before enabling deployments.
