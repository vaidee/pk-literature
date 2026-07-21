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
