# Generic reusable Lambda module — one instantiation per service
# (terraform-layout.md). Each service's own Terraform (e.g.
# environments/<env>/api-catalog.tf) supplies the deployment package,
# handler, VPC placement, and any extra IAM permissions; this module
# supplies the boilerplate every Lambda needs regardless of domain:
# execution role, log group, versioning + a `live` alias (the fast-path
# rollback target described in runbooks/rollback.md).

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "this" {
  name               = "pk-literature-${var.environment}-${var.service_name}"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

# CloudWatch Logs write — every Lambda needs this regardless of VPC
# placement (infrastructure/iam.md's "CloudWatch Logs write" on every
# lambda-api-* role).
resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ENI management for VPC-attached functions only (infrastructure/networking.md
# — Catalog/Feed/Search/Identity/publisher-import sit in private-isolated,
# Commerce sits in private-nat; both need this to attach to any subnet at all).
resource "aws_iam_role_policy_attachment" "vpc_access" {
  count = length(var.subnet_ids) > 0 ? 1 : 0

  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "additional" {
  # See ecs-service/main.tf's task_additional resource for why this is
  # gated on a caller-supplied literal boolean rather than
  # `var.additional_policy_json != null`: several callers' policy
  # documents reference module.rds_proxy.iam_auth_resource_id, which is
  # unknown until the RDS Proxy exists, making a `!= null` comparison
  # against the whole document unevaluable at plan time on a
  # first-ever apply.
  count = var.attach_additional_policy ? 1 : 0

  name   = "additional-permissions"
  role   = aws_iam_role.this.id
  policy = var.additional_policy_json
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/pk-literature-${var.environment}-${var.service_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "this" {
  function_name = "pk-literature-${var.environment}-${var.service_name}"
  role          = aws_iam_role.this.arn

  filename         = var.filename
  source_code_hash = var.source_code_hash
  handler          = var.handler
  runtime          = var.runtime
  memory_size      = var.memory_size
  timeout          = var.timeout
  architectures    = var.architectures

  # Publishes a new numbered version on every apply where the code
  # changed — the `live` alias below is what actually gets invoked,
  # so rollback (runbooks/rollback.md) is "move the alias," not
  # "redeploy an old commit."
  publish = true

  dynamic "vpc_config" {
    for_each = length(var.subnet_ids) > 0 ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }

  environment {
    variables = var.environment_variables
  }

  depends_on = [aws_cloudwatch_log_group.this]

  tags = {
    Environment = var.environment
    Service     = var.service_name
  }
}

resource "aws_lambda_alias" "live" {
  name             = "live"
  function_name    = aws_lambda_function.this.function_name
  function_version = aws_lambda_function.this.version
}
