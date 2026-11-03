# Creating an Egg

1. Choose a category and lowercase kebab-case slug.
2. Create `eggs/<category>/<slug>/egg.json`.
3. Use `schemaVersion: 1` and only supported runtime/install/startup modes.
4. Add one matching entry to `registry.json` with identical ID, name, description, category and version.
5. Run `npm run validate` and inspect the diff.
6. Document requirements, limitations and security implications in the pull request.

Do not include shell snippets as runtime instructions, hardcoded secrets, unverified remote installers or host filesystem access. Do not change existing Egg versions in place once they are published; introduce a new versioning policy before shipping updates.
