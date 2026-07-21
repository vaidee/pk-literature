output "api_id" {
  value = aws_apigatewayv2_api.this.id
}

output "api_execution_arn" {
  value = aws_apigatewayv2_api.this.execution_arn
}

output "stage_id" {
  value = aws_apigatewayv2_stage.v1.id
}

output "invoke_url" {
  value = "https://api.${var.domain_name}/v1"
}
