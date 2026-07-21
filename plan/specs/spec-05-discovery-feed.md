# SPEC-05 --- Discovery Feed

Version: 1.0 Status: Draft

## Purpose

The Discovery Feed is the primary homepage experience. Instead of asking
users to search first, the platform continuously recommends books
through editorial curation and lightweight personalization.

Users are not required to sign in.

------------------------------------------------------------------------

# Principles

-   Discovery before search
-   Anonymous personalization
-   Editorially guided
-   Explainable recommendations
-   Fast (\<200ms API target)

------------------------------------------------------------------------

# Feed Structure

The homepage is composed of horizontal shelves.

Examples:

-   Continue Exploring
-   New Arrivals
-   Trending
-   From Kalachuvadu
-   Similar to Books You Liked
-   Modern Tamil Fiction
-   Spirituality
-   Award Winners
-   Editor's Picks

Each shelf contains horizontally scrollable cards.

------------------------------------------------------------------------

# Book Card

Displays:

-   Cover
-   Title
-   Author
-   Publisher
-   Price
-   Like ❤️
-   Add to Cart
-   Quick View

Optional chips:

-   Theme
-   Bestseller
-   New
-   Award

------------------------------------------------------------------------

# Anonymous Personalization

On first visit:

Browser UUID

↓

Anonymous Profile

↓

Interest Store

The UUID is stored in a cookie/local storage.

No login required.

------------------------------------------------------------------------

# Like Signal

Each card exposes a Like button.

A like records:

-   book_id
-   author
-   publisher
-   themes
-   timestamp
-   anonymous_user_id

These signals update the anonymous interest profile.

------------------------------------------------------------------------

# Recommendation Signals

Weighted inputs:

1.  Likes
2.  Authors
3.  Publishers
4.  Themes
5.  Genres
6.  Editorial shelves
7.  Trending
8.  New releases

Future:

-   Knowledge graph
-   Semantic embeddings

------------------------------------------------------------------------

# Feed Generation

Request

↓

Load anonymous profile

↓

Determine candidate shelves

↓

Rank books within shelves

↓

Remove duplicates

↓

Return response

------------------------------------------------------------------------

# Shelf Rules

Every shelf:

-   5--20 items
-   Horizontal scrolling
-   Independent ranking
-   Cacheable

------------------------------------------------------------------------

# Taste Map

Feature flag controlled.

OFF by default.

When enabled, visualizes the user's interests based on:

-   Authors
-   Themes
-   Publishers

------------------------------------------------------------------------

# Feature Flags

-   Taste Map
-   Trending Shelf
-   AI Recommendations
-   Recently Viewed
-   Personalized Shelves

------------------------------------------------------------------------

# APIs

GET /feed

Returns ordered shelves.

POST /interest/like

Records anonymous like.

GET /feed/shelf/{id}

Returns additional items for infinite horizontal scrolling.

------------------------------------------------------------------------

# Data Model

interest_profile

-   anonymous_id
-   updated_at

interest_event

-   anonymous_id
-   book_id
-   action
-   timestamp

feed_shelf

-   id
-   name
-   type
-   enabled

------------------------------------------------------------------------

# Caching

CloudFront caches anonymous-independent shelves.

Personalized feed fragments cached by anonymous profile for short TTL.

------------------------------------------------------------------------

# Business Rules

-   Login not required.
-   Likes are reversible.
-   Duplicate books should be minimized across shelves.
-   Editorial shelves always take precedence over AI-generated shelves
    where configured.

------------------------------------------------------------------------

# Metrics

-   CTR
-   Likes per session
-   Shelf engagement
-   Add-to-cart rate
-   Discovery-to-purchase conversion

------------------------------------------------------------------------

# Future Enhancements

-   Collaborative filtering
-   AI recommendations
-   Reading journeys
-   Seasonal campaigns
-   Multi-language discovery

------------------------------------------------------------------------

# Acceptance Criteria

-   Homepage renders shelves.
-   Cards support Like and Add to Cart.
-   Likes influence future feed requests.
-   Taste Map can be enabled via feature flag.
-   Feed remains usable for first-time visitors.
