# Directus Collections

Mirrors `catalog` + `staging` schema (`plan/database/ddl/`). Directus
connects directly to Postgres and manages these as native collections —
it is the only write path into `catalog`.

## catalog schema

- Works
- Books
- Authors
- Publishers
- Themes
- Genres
- LiteraryMovements
- Collections
- MediaAssets
- Inventory

Junction collections (`WorkAuthors`, `BookContributors`, `WorkThemes`,
`WorkGenres`, `WorkLiteraryMovements`, `BookCollections`) are exposed as
Directus's built-in M:N relationship fields on the collections above,
not as separately browsable top-level collections.

## staging schema

- ImportRuns
- StagingBooks
- StagingInventory
- StagingMedia
- StagingValidation (renamed from "ValidationResults" to match the
  table name `staging_validation`)
- StagingRelationships

## Permissions (SPEC-03 Roles)

- **Catalog Editor**: read/write Works, Books (up to `approved`), all
  staging collections. Cannot set status to `published`/`archived`.
- **Senior Editor**: full read/write on all of the above, including
  `published`/`archived` transitions and merge-duplicate resolution.
- **Administrator**: full access, including Publishers/adapter config.
- Operations team (Medusa/commerce): no access to this Directus
  instance at all — commerce and catalog are separate schemas with
  separate admin surfaces (Medusa Admin vs Directus).
