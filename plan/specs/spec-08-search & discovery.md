# SPEC-08 v2
# Search & Discovery Engine

Version: 2.0

Status: Approved

Owner:
Platform Architecture

Related Documents

- PRD
- SPEC-02 Catalog
- SPEC-05 Discovery Feed
- SPEC-09 Tamil Literature Graph
- ADR-006 Discovery Feed
- ADR-007 Serverless First

---

# 1. Purpose

The Search & Discovery Engine enables users to efficiently discover Tamil literature through structured search, faceted navigation, autocomplete, recommendations, and semantic discovery.

Unlike traditional bookstore search, this engine prioritizes **discovery** over exact lookup.

---

# 2. Goals

The system SHALL support

✓ Keyword search

✓ Full text search

✓ Typo tolerance

✓ Tamil & English search

✓ Faceted filtering

✓ Publisher browsing

✓ Theme exploration

✓ Author discovery

✓ Collection discovery

✓ Similar books

✓ Anonymous personalization

✓ Future semantic search

---

# 3. Non Goals

Search SHALL NOT

Own catalog

Modify books

Store editorial metadata

Manage recommendations

Own inventory

---

# 4. Architecture

Browser

↓

API Gateway

↓

Search Service

↓

Query Parser

↓

Ranking Engine

↓

PostgreSQL

↓

Response

---

# 5. Search Domains

Books

Authors

Publishers

Themes

Genres

Collections

Series

Literary Movements

Future

Characters

Places

Awards

Historical Periods

---

# 6. Search Pipeline

User Query

↓

Normalize

↓

Language Detection

↓

Spell Correction

↓

Tokenization

↓

Full Text Search

↓

Fuzzy Matching

↓

Ranking

↓

Faceting

↓

Response

---

# 7. Language Support

Tamil

English

Mixed Tamil-English

Romanized Tamil (future)

Examples

"பொன்னியின் செல்வன்"

"Ponniyin Selvan"

"ponniyin"

---

# 8. Query Normalization

Trim whitespace

Lowercase English

Normalize Unicode

Remove duplicate spaces

Normalize punctuation

---

# 9. Tokenization

Tamil tokenizer

English tokenizer

Mixed language tokenizer

---

# 10. PostgreSQL Search

Uses

tsvector

tsquery

GIN indexes

pg_trgm

Future

pgvector

---

# 11. Indexed Fields

Books

Title

Subtitle

Description

ISBN

Authors

Name

Biography

Publishers

Name

Themes

Name

Collections

Name

---

# 12. Ranking Strategy

Exact Title

Weight 100

ISBN

95

Author

90

Publisher

80

Theme

70

Description

60

Popularity

50

Editorial Boost

40

Personalization

30

---

# 13. Fuzzy Search

Uses pg_trgm

Similarity Threshold

0.35

Examples

"jayamohan"

↓

Jeyamohan

"ponniyin"

↓

Ponniyin Selvan

---

# 14. Autocomplete

Triggered after

2 characters

Returns

Books

Authors

Publishers

Themes

Collections

Maximum

10 results

---

# 15. Faceted Search

Publisher

Author

Theme

Genre

Language

Price

Availability

Publication Year

Collections

---

# 16. Search Response

Contains

Results

Facets

Suggestions

Related Searches

Pagination

---

# 17. Similar Books

Signals

Shared Author

Shared Theme

Shared Publisher

Shared Genre

Knowledge Graph

Future

Embedding Similarity

---

# 18. Browse Experience

Browse by

Publisher

Author

Theme

Collection

Genre

Movement

---

# 19. Trending

Future feature

Inputs

Views

Likes

Purchases

Editorial Boost

---

# 20. Search Analytics

Captured

Query

Latency

Clicks

CTR

Zero Results

Refinements

No PII stored.

---

# 21. Personalization

Anonymous Profile

↓

Liked Themes

↓

Liked Authors

↓

Liked Publishers

↓

Ranking Boost

---

# 22. Caching

Autocomplete

CloudFront

15 min

Search

API Cache

1 min

Publisher Pages

CloudFront

1 hour

---

# 23. APIs

GET /search

GET /autocomplete

GET /browse/publishers

GET /browse/authors

GET /browse/themes

GET /browse/collections

GET /books/{id}/similar

---

# 24. OpenAPI Contracts

SearchRequest

SearchResponse

FacetResponse

AutocompleteResponse

ErrorResponse

---

# 25. Error Handling

Invalid Query

400

Empty Query

400

Timeout

503

Unexpected Error

500

---

# 26. Performance

Autocomplete

<100 ms

Search

<250 ms

Facets

<300 ms

100k books

Supported

---

# 27. Security

Rate limiting

Query sanitization

Parameterized SQL

No wildcard abuse

---

# 28. Observability

Metrics

Search latency

Autocomplete latency

Zero result %

Top queries

CTR

CloudWatch dashboard

---

# 29. Testing

Unit tests

Ranking tests

Language tests

Integration tests

Performance tests

---

# 30. Acceptance Criteria

✓ Tamil search works

✓ English search works

✓ Typo correction works

✓ Facets filter correctly

✓ Similar books available

✓ Anonymous personalization influences ranking

✓ Supports 100,000 books

---

# Appendix A

Ranking Formula

---

# Appendix B

PostgreSQL Indexes

GIN

GIN_TRGM

BTREE

---

# Appendix C

Sample Queries

"ஜெயமோகன்"

"Ponniyin Selvan"

"History"

"Kalachuvadu"

---

# Appendix D

Future Roadmap

Semantic Search (pgvector)

Hybrid Search

LLM Query Expansion

Conversational Search

Voice Search

Cross-language Retrieval

Knowledge Graph Traversal