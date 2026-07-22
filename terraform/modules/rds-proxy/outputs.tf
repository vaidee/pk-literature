output "proxy_endpoint" {
  value = aws_db_proxy.this.endpoint
}

output "proxy_arn" {
  value = aws_db_proxy.this.arn
}

output "proxy_name" {
  value = aws_db_proxy.this.name
}

# For rds-db:connect IAM policies (infrastructure/iam.md). The
# resource ARN for connecting through RDS Proxy with IAM auth is
# `arn:aws:rds-db:<region>:<account>:dbuser:<proxy-resource-id>/<db-user>`
# — note the service is `rds-db`, not `rds`, and the resource-id
# segment is the proxy's own id (prx-xxxxxxxx), not the underlying DB
# instance's. aws_db_proxy's ARN is `arn:aws:rds:<region>:<account>:
# db-proxy:<resource-id>` — this output extracts just that last segment
# so consumers don't have to re-derive it.
output "iam_auth_resource_id" {
  value = element(split(":", aws_db_proxy.this.arn), 6)
}
