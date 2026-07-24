-- Up Migration
-- First real publisher record — enables the manual
-- publisher-import.yml workflow_dispatch run (publisher_id/
-- publisher_code inputs) documented in runbooks/deploy.md. code must
-- stay 'kalachuvadu' to match the only adapter registered in
-- apps/publisher-crawler/src/adapters-registry.ts.

INSERT INTO catalog.publishers (name, code, website, adapter_type, active)
VALUES (
  'Kalachuvadu',
  'kalachuvadu',
  'https://books.kalachuvadu.com/kcbooks/Allproducts',
  'html',
  true
)
ON CONFLICT (code) DO NOTHING;

-- Down Migration

DELETE FROM catalog.publishers WHERE code = 'kalachuvadu';
