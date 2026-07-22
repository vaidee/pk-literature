# Shared Fargate cluster, first created by phase-2 (Directus) and
# reused by phase-6 (Medusa) — an ECS cluster is just a logical
# namespace over Fargate tasks, not a billable resource of its own, so
# there's no cost reason to split one per admin surface. Kept in its
# own file (not main.tf, not directus.tf) since ownership spans phases
# — development/branching.md's "each phase owns its own infra" rule
# doesn't cleanly apply to a resource two phases share.

resource "aws_ecs_cluster" "this" {
  name = "pk-literature-qa"

  setting {
    name  = "containerInsights"
    value = "disabled" # cost-estimation.md — enable per-env later if needed
  }

  tags = {
    Environment = "qa"
  }
}
