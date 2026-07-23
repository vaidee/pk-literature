# infrastructure/iam.md's external runner role — assumed by the
# GitHub Actions workflow that runs the publisher adapter crawlers
# outside AWS (.github/workflows/publisher-import.yml, ADR-009). Lives
# in bootstrap alongside gha-deploy-* for the same reason (oidc.tf's own
# header comment): the trust relationship must survive an environment
# teardown.
#
# Deliberately its own file, not appended to oidc.tf — oidc.tf is about
# CI's ability to *deploy* infrastructure; this is a runtime data-path
# credential with a completely different (much narrower) permission
# shape, and the two shouldn't be visually conflated.

locals {
  # Same dev-is-permissive/qa+prod-are-main-only split as
  # oidc.tf's deploy_role_trusted_refs, and for the same reason: allow
  # testing a phase branch's crawler workflow against dev before merge,
  # but never run the scheduled/production crawl from anything but main.
  #
  # prod includes "environment:prod" for the same reason as
  # oidc.tf's deploy_role_trusted_refs.prod: publisher-import.yml's
  # import-prod job sets a top-level `environment: prod` key, which
  # swaps the OIDC token's sub claim to the environment-scoped form
  # ("repo:OWNER/REPO:environment:prod") instead of the ref-based one
  # — see that comment for the full explanation.
  publisher_import_trusted_refs = {
    dev  = ["ref:refs/heads/*", "pull_request"]
    qa   = ["ref:refs/heads/main"]
    prod = ["ref:refs/heads/main", "environment:prod"]
  }
}

data "aws_iam_policy_document" "gha_publisher_import_assume_role" {
  for_each = toset(var.environments)

  statement {
    effect = "Allow"
    # Same sts:TagSession requirement as oidc.tf's gha_deploy_assume_role
    # — aws-actions/configure-aws-credentials@v4 attaches session tags
    # by default, and AWS rejects the whole AssumeRoleWithWebIdentity
    # call (not a separate error) if that action isn't also granted.
    actions = ["sts:AssumeRoleWithWebIdentity", "sts:TagSession"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Same "immutable ID" subject-claim format as oidc.tf's
    # gha_deploy_assume_role — see that condition's comment.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = flatten([
        for ref in local.publisher_import_trusted_refs[each.value] : [
          "repo:${var.github_org}/${var.github_repo}:${ref}",
          "repo:${var.github_org}@*/${var.github_repo}@*:${ref}",
        ]
      ])
    }
  }
}

resource "aws_iam_role" "gha_publisher_import" {
  for_each = toset(var.environments)

  name               = "gha-publisher-import-${each.value}"
  assume_role_policy = data.aws_iam_policy_document.gha_publisher_import_assume_role[each.value].json

  tags = {
    Environment = each.value
  }
}

# execute-api:Invoke only, on exactly the staging-ingest routes
# (terraform/environments/<env>/api-publisher-import.tf) — no S3, no
# Secrets Manager, no direct DB access (infrastructure/iam.md). The
# api-id segment is wildcarded rather than referencing
# module.api_gateway.api_id: bootstrap and environments/<env> are
# separate Terraform states applied in sequence (bootstrap first,
# per terraform-layout.md), so the API Gateway doesn't exist yet at the
# point this role is created — there's no value to reference even if
# cross-state data sources were wired up, which they deliberately
# aren't (bootstrap/README.md's manual-copy convention). Each
# environment's account has exactly one HTTP API in practice, so this
# is a real narrowing (method + exact resource path), not a
# rubber-stamped wildcard.
data "aws_iam_policy_document" "gha_publisher_import_permissions" {
  for_each = toset(var.environments)

  statement {
    sid     = "InvokeStagingIngestRoutes"
    effect  = "Allow"
    actions = ["execute-api:Invoke"]
    resources = [
      "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/*/GET/v1/publishers/*/cursor",
      "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/*/POST/v1/publishers/*/import-runs",
      "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/*/POST/v1/import-runs/*/books",
      "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/*/POST/v1/import-runs/*/complete",
    ]
  }
}

resource "aws_iam_role_policy" "gha_publisher_import" {
  for_each = toset(var.environments)

  name   = "gha-publisher-import-${each.value}-permissions"
  role   = aws_iam_role.gha_publisher_import[each.value].id
  policy = data.aws_iam_policy_document.gha_publisher_import_permissions[each.value].json
}
