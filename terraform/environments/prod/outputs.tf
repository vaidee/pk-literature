output "vpc_id" {
  value = module.vpc.vpc_id
}

output "rds_proxy_endpoint" {
  value = module.rds_proxy.proxy_endpoint
}

output "api_gateway_invoke_url" {
  value = module.api_gateway.invoke_url
}

output "cloudfront_domain_name" {
  value = module.cloudfront.distribution_domain_name
}

output "media_bucket_id" {
  value = module.s3.bucket_id
}

output "eventbridge_bus_name" {
  value = module.eventbridge.bus_name
}

output "hosted_zone_id" {
  value = module.route53_acm.zone_id
}

output "web_static_assets_bucket_id" {
  description = "apps/web's OpenNext static assets bucket — terraform-apply.yml syncs .open-next/assets here after apply."
  value       = module.opennext.static_assets_bucket_id
}

output "web_distribution_id" {
  description = "apps/web's own CloudFront distribution (separate from module.cloudfront's media/cdn one) — invalidated after the static asset sync."
  value       = module.cloudfront_web.distribution_id
}
