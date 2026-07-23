output "db_instance_id" {
  # NOT .id — for aws_db_instance, .id resolves to the DbiResourceId
  # ("db-XXXXXXXXXXXX...", the same value as .resource_id below), not
  # the human-assigned identifier. Every consumer of this output
  # (rds-proxy's db_instance_identifier, cloudwatch's DBInstanceIdentifier
  # alarm dimension) needs the actual identifier string — confirmed by a
  # real apply failure: "only lowercase alphanumeric characters and
  # hyphens allowed in db_instance_identifier" when this was .id.
  value = aws_db_instance.this.identifier
}

output "db_instance_arn" {
  value = aws_db_instance.this.arn
}

output "db_instance_resource_id" {
  description = "Used to construct the RDS Proxy IAM auth connection ARN."
  value       = aws_db_instance.this.resource_id
}

output "db_endpoint" {
  value = aws_db_instance.this.endpoint
}

output "db_address" {
  value = aws_db_instance.this.address
}

output "db_port" {
  value = aws_db_instance.this.port
}

output "db_name" {
  value = aws_db_instance.this.db_name
}
