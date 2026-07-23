output "s3_endpoint_id" {
  value = var.create_endpoints ? aws_vpc_endpoint.s3[0].id : null
}

output "interface_endpoint_ids" {
  value = { for k, v in aws_vpc_endpoint.interface : k => v.id }
}
