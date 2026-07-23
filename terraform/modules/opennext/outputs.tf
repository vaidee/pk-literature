output "static_assets_bucket_id" {
  value = aws_s3_bucket.static_assets.id
}

output "static_assets_bucket_arn" {
  value = aws_s3_bucket.static_assets.arn
}

output "static_assets_bucket_regional_domain_name" {
  value = aws_s3_bucket.static_assets.bucket_regional_domain_name
}

output "server_function_name" {
  value = module.server_lambda.function_name
}

output "server_function_arn" {
  value = module.server_lambda.alias_arn
}

# CloudFront's aws_cloudfront_origin's domain_name for a Lambda Function
# URL origin is the URL's own host, with the https:// scheme and
# trailing slash stripped off.
output "server_function_url_domain" {
  value = replace(replace(aws_lambda_function_url.server.function_url, "https://", ""), "/", "")
}

output "image_function_name" {
  value = module.image_lambda.function_name
}

output "image_function_arn" {
  value = module.image_lambda.alias_arn
}

output "image_function_url_domain" {
  value = replace(replace(aws_lambda_function_url.image.function_url, "https://", ""), "/", "")
}
