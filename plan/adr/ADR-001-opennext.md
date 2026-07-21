# ADR-001: Adopt OpenNext for Frontend Hosting

## Status

Accepted \## Context Need AWS-native hosting for Next.js without vendor
lock-in. \## Decision Use OpenNext deployed on AWS (Lambda, S3,
CloudFront). \## Consequences + Full AWS ownership + Infrastructure
managed with Terraform + Lower lock-in than managed hosting platforms -
Slightly more operational responsibility
