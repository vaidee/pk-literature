# Phase 0 shell: media (covers/logos) origin only, since no OpenNext
# frontend exists yet. Whichever phase adds apps/web adds a second
# origin + repoints the default cache behavior at it, with this media
# origin moved to a /media/* path pattern behavior instead of default.

locals {
  media_origin_id = "media-s3"
}

resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "pk-literature-${var.environment}-media"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = ["cdn.${var.domain_name}"]
  comment         = "pk-literature-${var.environment}"

  origin {
    domain_name              = var.media_bucket_regional_domain_name
    origin_id                = local.media_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
  }

  default_cache_behavior {
    target_origin_id       = local.media_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.cloudfront_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_route53_record" "cdn" {
  zone_id = var.hosted_zone_id
  name    = "cdn.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

# OAC bucket policy — created here, not in the s3 module, since it needs
# both this distribution's own ARN and the bucket's ARN (see the
# comment in modules/s3/main.tf on why this avoids a circular module
# dependency).
data "aws_iam_policy_document" "media_oac" {
  statement {
    sid       = "AllowCloudFrontServicePrincipal"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${var.media_bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "media_oac" {
  bucket = var.media_bucket_id
  policy = data.aws_iam_policy_document.media_oac.json
}
