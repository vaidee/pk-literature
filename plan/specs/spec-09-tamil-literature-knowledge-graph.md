# SPEC-09 --- Tamil Literature Knowledge Graph

Version: 1.0

## Purpose

Represent relationships across Tamil literature to power discovery,
recommendations and editorial insights.

The graph is an editorial asset and strategic differentiator.

## Core Entities

-   Book
-   Author
-   Publisher
-   Theme
-   Genre
-   Literary Movement
-   Character
-   Place
-   Award
-   Historical Period
-   Translation
-   Collection

## Relationship Types

-   WRITTEN_BY
-   PUBLISHED_BY
-   BELONGS_TO_THEME
-   BELONGS_TO_GENRE
-   PART_OF_COLLECTION
-   TRANSLATION_OF
-   INFLUENCED_BY
-   REFERENCES
-   SET_IN
-   FEATURES_CHARACTER
-   RECOMMENDED_AFTER
-   SIMILAR_TO

## Editorial Management

Relationships are created and curated through Directus.

AI may suggest relationships but editors approve them.

## Use Cases

-   Similar books
-   Reading journeys
-   Author exploration
-   Literary movement pages
-   Theme pages
-   Timeline exploration
-   Recommendation engine

## APIs

GET /graph/book/{id} GET /graph/author/{id} GET /graph/related/{id}

## Graph Traversal

Book ↓ Author ↓ Movement ↓ Related Authors ↓ Related Books

## AI Enrichment

-   Theme extraction
-   Similarity detection
-   Influence suggestions
-   Character extraction
-   Timeline inference

## Future Visualization

-   Interactive network graph
-   Reading paths
-   Literary timelines
-   Geographic map
-   Author influence graph

## Acceptance Criteria

Every published book may participate in zero or more graph
relationships. Graph APIs are read-only for public users. Editorial
users manage graph content via Directus.
