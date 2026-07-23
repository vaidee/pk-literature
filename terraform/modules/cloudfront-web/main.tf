# apps/web's own distribution, deliberately separate from
# modules/cloudfront (which serves catalog.media_assets at
# cdn.${domain_name} and is already relied on by every previously-shipped
# phase's stored/generated URLs). Folding the two together — as an
# earlier phase's leftover comment in modules/cloudfront originally
# proposed — would mean moving the media origin onto a /media/* path
# behavior, which changes the URL shape every already-merged phase
# (Directus config, apps/api-catalog, etc.) already writes into
# catalog.media_assets.s3_key-derived URLs. Not worth that blast radius
# just to save one distribution; this app gets its own at the bare
# domain_name instead.

locals {
  static_origin_id = "web-static-s3"
  server_origin_id = "web-server-lambda"
  image_origin_id  = "web-image-lambda"
}

resource "aws_cloudfront_origin_access_control" "static_assets" {
  name                              = "pk-literature-${var.environment}-web-static"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "server_lambda" {
  name                              = "pk-literature-${var.environment}-web-server"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "image_lambda" {
  name                              = "pk-literature-${var.environment}-web-image"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = [var.domain_name]
  comment         = "pk-literature-${var.environment}-web"

  origin {
    domain_name              = var.static_assets_bucket_regional_domain_name
    origin_id                = local.static_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.static_assets.id
  }

  origin {
    domain_name              = var.server_function_url_domain
    origin_id                = local.server_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.server_lambda.id

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_read_timeout      = 30
      origin_keepalive_timeout = 5
    }
  }

  origin {
    domain_name              = var.image_function_url_domain
    origin_id                = local.image_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.image_lambda.id

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_read_timeout      = 25
      origin_keepalive_timeout = 5
    }
  }

  # Every route in this app is `dynamic = "force-dynamic"` (app/layout.tsx
  # — CartLink/AccountLink in the shared header forward the visitor's
  # anonymous_id/auth cookies on every request), so nothing here is
  # cacheable at the edge; this behavior exists to route requests to the
  # server Lambda and forward what it needs, not to cache responses.
  default_cache_behavior {
    target_origin_id       = local.server_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Accept", "Host"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # next.config.ts / @opennextjs/aws emit /_next/static/* with
  # content-hashed filenames — safe to cache aggressively and forward
  # nothing.
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = local.static_origin_id
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
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  # next/image requests carry the source path + w/q resize params as a
  # query string and negotiate format via Accept — both need forwarding
  # for a correctly-resized, correctly-formatted response, but no
  # cookies (image bytes don't vary per visitor here).
  ordered_cache_behavior {
    path_pattern           = "/_next/image"
    target_origin_id       = local.image_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Accept"]
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

resource "aws_route53_record" "web" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

# OAC bucket policy — same "must live where the distribution ARN is
# available" reasoning as modules/cloudfront's media_oac.
data "aws_iam_policy_document" "static_assets_oac" {
  statement {
    sid       = "AllowCloudFrontServicePrincipal"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${var.static_assets_bucket_arn}/*"]

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

resource "aws_s3_bucket_policy" "static_assets_oac" {
  bucket = var.static_assets_bucket_id
  policy = data.aws_iam_policy_document.static_assets_oac.json
}

# Lambda Function URL OAC — the equivalent of the S3 bucket policy
# above, but granting CloudFront's service principal
# lambda:InvokeFunctionUrl instead of s3:GetObject. Function URLs were
# created with authorization_type = "AWS_IAM" (modules/opennext), so
# without this, CloudFront's signed OAC requests would be rejected.
resource "aws_lambda_permission" "cloudfront_invoke_server" {
  statement_id           = "AllowCloudFrontServicePrincipal"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = var.server_function_arn
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.this.arn
  function_url_auth_type = "AWS_IAM"
}

resource "aws_lambda_permission" "cloudfront_invoke_image" {
  statement_id           = "AllowCloudFrontServicePrincipal"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = var.image_function_arn
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.this.arn
  function_url_auth_type = "AWS_IAM"
}
