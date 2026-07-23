# Phase 0 baseline only (infrastructure/monitoring.md's "Platform-wide"
# section) — Lambda/ECS/domain-specific alarms and dashboard widgets are
# added by each phase alongside the resources they monitor.

resource "aws_sns_topic" "alarms" {
  name = "pk-literature-${var.environment}-alarms"

  tags = {
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "pk-literature-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU > 80% over 10 min (infrastructure/monitoring.md)"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_proxy_connections" {
  alarm_name          = "pk-literature-${var.environment}-rds-proxy-pool-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnectionsCurrentlyInTransaction"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS Proxy connection pool nearing exhaustion (infrastructure/monitoring.md)"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ProxyName = var.rds_proxy_name
  }
}

resource "aws_cloudwatch_metric_alarm" "nat_port_allocation_errors" {
  for_each = toset(var.nat_gateway_ids)

  alarm_name          = "pk-literature-${var.environment}-nat-port-allocation-errors-${each.value}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ErrorPortAllocation"
  namespace           = "AWS/NATGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "NAT Gateway port allocation errors — early warning that the single-NAT tradeoff (infrastructure/networking.md) needs revisiting"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    NatGatewayId = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "pk-literature-${var.environment}-api-gateway-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "API Gateway 5xx rate elevated (infrastructure/monitoring.md)"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiId = var.api_gateway_id
  }
}

data "aws_region" "current" {}

resource "aws_cloudwatch_dashboard" "platform" {
  dashboard_name = "pk-literature-${var.environment}-platform"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "RDS CPU"
          region  = data.aws_region.current.name
          metrics = [["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_id]]
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway requests / 5xx"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", var.api_gateway_id],
            ["AWS/ApiGateway", "5xx", "ApiId", var.api_gateway_id],
          ]
          period = 300
          stat   = "Sum"
        }
      },
    ]
  })
}
