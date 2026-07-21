# SPEC-07 --- User & Identity

Version: 1.0 Status: Draft

## Purpose

Provide identity and profile capabilities while preserving a
frictionless, discovery-first experience. Users should be able to
browse, like, and purchase books without mandatory registration, while
optionally creating an account for synchronization and order history.

------------------------------------------------------------------------

# Design Principles

-   Anonymous-first
-   Privacy by default
-   Progressive identity
-   Seamless migration from anonymous to registered
-   Least privilege authorization

------------------------------------------------------------------------

# User Types

## Anonymous Visitor

Can:

-   Browse feed
-   Search books
-   Like books
-   Add to cart
-   Checkout
-   Purchase books

Cannot:

-   View previous orders across devices
-   Synchronize preferences

------------------------------------------------------------------------

## Registered User

Additional capabilities:

-   Order history
-   Saved addresses
-   Wishlist (future)
-   Sync preferences across devices
-   Email notifications

------------------------------------------------------------------------

## Editorial Users

Managed separately through Directus authentication.

------------------------------------------------------------------------

# Identity Model

Anonymous Session

↓

Anonymous UUID

↓

Interest Profile

↓

(Optional)

Create Account

↓

Merge Anonymous Data

↓

Registered Profile

------------------------------------------------------------------------

# Authentication

Supported methods

-   Email + OTP (future)
-   Google OAuth (future)
-   Apple Sign-In (future)

Editors authenticate through Directus.

------------------------------------------------------------------------

# Session Management

Anonymous:

-   Secure cookie
-   Anonymous UUID
-   Short-lived session

Registered:

-   JWT access token
-   Refresh token
-   Secure HTTP-only cookies

------------------------------------------------------------------------

# User Profile

Fields

-   user_id
-   display_name
-   email
-   phone
-   preferred_language
-   created_at

------------------------------------------------------------------------

# Address Book

Fields

-   name
-   phone
-   address
-   city
-   state
-   postal_code
-   country
-   default_flag

------------------------------------------------------------------------

# Anonymous Merge

When a user signs up:

Merge

-   Likes
-   Interest profile
-   Cart
-   Preferences

Do not duplicate events.

------------------------------------------------------------------------

# Authorization

Public APIs

-   Feed
-   Search
-   Catalog

Authenticated APIs

-   Orders
-   Profile
-   Address Book

Editorial APIs

-   Directus only

------------------------------------------------------------------------

# APIs

POST /auth/login

POST /auth/logout

POST /auth/register

GET /profile

PATCH /profile

GET /addresses

POST /addresses

PATCH /addresses/{id}

DELETE /addresses/{id}

------------------------------------------------------------------------

# Database

identity schema

Tables

-   users
-   sessions
-   addresses
-   anonymous_profiles
-   profile_preferences

------------------------------------------------------------------------

# Privacy

Personally identifiable information is stored only for registered users.

Anonymous browsing data is linked only to an anonymous UUID until
account creation.

------------------------------------------------------------------------

# Security

-   Passwordless-ready architecture
-   HTTP-only cookies
-   CSRF protection
-   Rate limiting
-   MFA support (future)

------------------------------------------------------------------------

# Future Enhancements

-   Reading history
-   Wishlists
-   Reading lists
-   Social sharing
-   Community reviews

------------------------------------------------------------------------

# Acceptance Criteria

-   Users can browse without login.
-   Anonymous likes personalize the feed.
-   Anonymous carts survive browser sessions.
-   Registration merges existing anonymous data.
-   Editorial authentication remains isolated from customer identity.
