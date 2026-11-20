# Default artwork per Egg

Eggs and application profiles can declare optional banners and icons. Administrators can also assign images from the existing Artwork library to any Egg, without changing its manifest.

In the panel, open **Eggs → Edit → Default Egg artwork**. **Assign custom Egg artwork** opens the Artwork library with that Egg preselected for a new assignment. Upload an image, assign it to the Egg and mark it as the default. Additional enabled variants remain selectable by service owners.

## Repository manifest

Both the repository `schemaVersion: 1` format and normalized `tyravex-egg` format accept this optional section:

```json
"artwork": {
  "banner": {
    "path": "artwork/discord/banner.webp",
    "sha256": "REPLACE_WITH_ACTUAL_64_CHARACTER_LOWERCASE_SHA256"
  },
  "icon": {
    "path": "artwork/discord/icon.png",
    "sha256": "REPLACE_WITH_ACTUAL_64_CHARACTER_LOWERCASE_SHA256"
  }
}
```

Profiles accept the same optional `artwork` section. Either channel may be omitted. Paths are relative to the **repository root**, not the directory containing `egg.json`. Calculate each digest from the original image bytes, for example:

```powershell
(Get-FileHash -LiteralPath '.\artwork\discord\banner.webp' -Algorithm SHA256).Hash.ToLowerInvariant()
```

New repository imports attempt to import declared graphics after the Egg transaction commits. Artwork failures do not discard an otherwise valid Egg import; existing choices remain unchanged and the administrator can retry **Load Egg artwork**. File imports without pinned repository provenance use manual Artwork assignments instead. No new images are fabricated for existing Eggs that have no declaration or administrator assignment.

Downloads are limited to the provenance's commit-pinned public GitHub repository, verify all DNS results and pin the connection address, accept no redirects/compression, limit time and size, verify the original SHA-256 digest, and normalize images before storing them. Browsers use local asset endpoints. Source choices are read-only; create an administrator default to override them.

## Resolution

An explicit service/user selection wins. Automatic defaults are resolved in order:

1. Service default.
2. Profile administrator default, then profile repository artwork.
3. Egg administrator default, then Egg repository artwork.
4. Category default.
5. Built-in Tyravex appearance.

Banners and icons inherit independently. Non-default variants remain available to the user but do not replace a repository default automatically. Manual targets are keyed by repository and Egg key and survive Egg updates. Repository graphics additionally include the Egg version, so importing a pending version does not alter services assigned to another version.

## Storage and permissions

The downloader pins public DNS resolution, refuses redirects and encoded responses, enforces 5 MiB and 8-second limits, and verifies SHA-256 before image decoding. The existing Artwork store re-encodes supported raster files to metadata-free WebP. Assets are served locally through authenticated access checks.

Imported choices use `EGG_SOURCE`/`PROFILE_SOURCE`; these are read-only and never overwrite manual `EGG`/`PROFILE` choices. The importer publishes all choices for one Egg atomically. Source assets are reusable by content hash.

Reading the Egg artwork panel requires `egg:read` or `settings:read`; importing requires `egg:manage` or `settings:manage`. Existing library editing uses settings permissions. Source declarations grant no installation approval or RBAC privileges. No migration is needed.
