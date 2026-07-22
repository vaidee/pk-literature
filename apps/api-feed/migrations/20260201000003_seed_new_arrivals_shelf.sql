-- Up Migration
-- Seeds the one shelf that should always exist out of the box:
-- New Arrivals (SPEC-05 — not feature-flagged, unlike
-- trending/personalized_similar, which apps/api-feed's FeedService
-- synthesizes purely from FEATURE_* env vars without ever reading a
-- feed_shelves row for them — there's nothing per-instance to
-- configure about them yet, so seeding a row would just be dead data).
-- Editorial shelves aren't seeded here at all: they're created by an
-- editor once there's an admin surface for it (not yet — feed_shelves
-- isn't one of Directus's tracked collections yet, since it didn't
-- exist when apps/directus/scripts/bootstrap.ts was written in
-- phase-2; adding it there is a reasonable follow-up, not redone here).

INSERT INTO discovery.feed_shelves (name, slug, type, sort_order, enabled)
VALUES ('New Arrivals', 'new-arrivals', 'new_arrivals', 0, true);

-- Down Migration

DELETE FROM discovery.feed_shelves WHERE slug = 'new-arrivals';
