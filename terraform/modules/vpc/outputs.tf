output "vpc_id" {
  value = var.create_vpc ? aws_vpc.this[0].id : var.existing_vpc_id
}

output "vpc_cidr" {
  value = var.create_vpc ? aws_vpc.this[0].cidr_block : data.aws_vpc.existing[0].cidr_block
}

output "public_subnet_ids" {
  value = var.create_vpc ? [for s in aws_subnet.public : s.id] : var.existing_public_subnet_ids
}

output "private_isolated_subnet_ids" {
  value = var.create_vpc ? [for s in aws_subnet.private_isolated : s.id] : var.existing_private_isolated_subnet_ids
}

output "private_nat_subnet_ids" {
  value = var.create_vpc ? [for s in aws_subnet.private_nat : s.id] : var.existing_private_nat_subnet_ids
}

output "private_isolated_route_table_id" {
  description = "Single shared route table for the private-isolated tier — used to attach the S3 gateway VPC endpoint."
  value       = var.create_vpc ? aws_route_table.private_isolated[0].id : var.existing_private_isolated_route_table_id
}

output "nat_gateway_ids" {
  value = var.create_vpc ? [for n in aws_nat_gateway.this : n.id] : var.existing_nat_gateway_ids
}
