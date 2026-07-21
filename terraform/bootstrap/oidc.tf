# GitHub Actions OIDC federation — no long-lived IAM user access keys
# anywhere in the platform. AWS allows only one IAM OIDC provider per
# provider URL per account, so this is genuinely account-level, not
# per-environment. See infrastructure/iam.md.

data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = [
    data.tls_certificate.github_actions.certificates[0].sha1_fingerprint,
  ]
}

# One deploy role per environment. Trust policy scopes which
# branch/ref is allowed to assume which role — phase branches and main
# can assume gha-deploy-dev; only main can assume gha-deploy-qa/prod
# (spec-12-cicd.md's pipeline only ever runs the qa/prod apply steps
# after merge to main, so the trust policy mirrors that rather than
# relying on the workflow alone to enforce it).
locals {
  deploy_role_trusted_refs = {
    dev  = ["ref:refs/heads/*", "pull_request"] # any branch/PR may plan+apply dev
    qa   = ["ref:refs/heads/main"]
    prod = ["ref:refs/heads/main"]
  }
}

data "aws_iam_policy_document" "gha_deploy_assume_role" {
  for_each = toset(var.environments)

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        for ref in local.deploy_role_trusted_refs[each.value] :
        "repo:${var.github_org}/${var.github_repo}:${ref}"
      ]
    }
  }
}

resource "aws_iam_role" "gha_deploy" {
  for_each = toset(var.environments)

  name               = "gha-deploy-${each.value}"
  assume_role_policy = data.aws_iam_policy_document.gha_deploy_assume_role[each.value].json

  tags = {
    Environment = each.value
  }
}

# Scoped to exactly the AWS services Terraform manages for that
# environment — no AdministratorAccess anywhere (infrastructure/iam.md).
# Deliberately broad-but-listed rather than "*" on any service, so a
# `terraform plan` diff against this policy is a meaningful review
# signal if it ever needs to grow.
data "aws_iam_policy_document" "gha_deploy_permissions" {
  for_each = toset(var.environments)

  statement {
    sid    = "TerraformManagedServices"
    effect = "Allow"
    actions = [
      "ec2:*",
      "rds:*",
      "s3:*",
      "iam:*",
      "secretsmanager:*",
      "events:*",
      "logs:*",
      "cloudwatch:*",
      "sns:*",
      "apigateway:*",
      "cloudfront:*",
      "route53:*",
      "acm:*",
      "lambda:*",
      "ecs:*",
      "ecr:*",
      "elasticloadbalancing:*",
      "application-autoscaling:*",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = ["*"]
  }

  statement {
    sid     = "TerraformStateAccess"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
  }

  statement {
    sid       = "TerraformStateLock"
    effect    = "Allow"
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
    resources = [aws_dynamodb_table.terraform_locks.arn]
  }
}

resource "aws_iam_role_policy" "gha_deploy" {
  for_each = toset(var.environments)

  name   = "gha-deploy-${each.value}-permissions"
  role   = aws_iam_role.gha_deploy[each.value].id
  policy = data.aws_iam_policy_document.gha_deploy_permissions[each.value].json
}
