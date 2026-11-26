BEGIN;

DROP INDEX shared_projects_public_catalog_idx;
ALTER TABLE shared_projects DROP COLUMN is_public;

COMMIT;
