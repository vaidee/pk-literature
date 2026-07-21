output "vpc_id" {
  value = aws_vpc.this.id
}

output "vpc_cidr" {
  value = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  value = [for s in aws_subnet.public : s.id]
}

output "private_isolated_subnet_ids" {
  value = [for s in aws_subnet.private_isolated : s.id]
}

output "private_nat_subnet_ids" {
  value = [for s in aws_subnet.private_nat : s.id]
}

output "private_isolated_route_table_id" {
  description = "Single shared route table for the private-isolated tier — used to attach the S3 gateway VPC endpoint."
  value       = aws_route_table.private_isolated.id
}

output "nat_gateway_ids" {
  value = [for n in aws_nat_gateway.this : n.id]
}
