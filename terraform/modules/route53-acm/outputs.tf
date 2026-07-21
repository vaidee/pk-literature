output "zone_id" {
  value = local.zone_id
}

output "regional_certificate_arn" {
  value = aws_acm_certificate_validation.regional.certificate_arn
}

output "cloudfront_certificate_arn" {
  value = aws_acm_certificate_validation.cloudfront.certificate_arn
}
