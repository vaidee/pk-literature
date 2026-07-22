# Shared across environments — the same image is promoted dev -> qa ->
# prod, so this isn't per-environment (terraform-layout.md). Directus's
# ECS task pulls from here, not Docker Hub directly: it lives in the
# private-isolated subnet tier (ADR-009, no NAT), so a CI step mirrors
# the official directus/directus image into this repo (CI runners have
# normal internet access; the running ECS task does not need any).

resource "aws_ecr_repository" "directus" {
  name                 = "pk-literature/directus"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "directus" {
  repository = aws_ecr_repository.directus.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      }
    ]
  })
}

# medusa ECR repo added by phase-6-commerce, same reasoning.
