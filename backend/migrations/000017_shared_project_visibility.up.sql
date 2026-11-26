BEGIN;

ALTER TABLE shared_projects ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX shared_projects_public_catalog_idx ON shared_projects (id DESC) WHERE is_public;

COMMIT;
