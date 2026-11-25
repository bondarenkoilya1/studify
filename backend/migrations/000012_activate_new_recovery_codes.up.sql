-- Existing codes cannot be attributed to the current 2FA enrollment.
ALTER TABLE recovery_codes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE;
