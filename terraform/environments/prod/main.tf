# Phase 0 foundations — prod environment. Same module set as dev/qa,
# only sizing/safety flags differ (SPEC-12 acceptance criterion). See
# plan/implementation-blueprint/infrastructure/terraform-layout.md for
# the build order this follows and why.
#
# Safety flags that differ from dev/qa, all per
# infrastructure/cost-estimation.md and runbooks/backup.md:
#   - instance_class: db.t4g.medium, not micro
#   - deletion_protection: true (RDS resource-level guard, independent
#     of the Terraform-state-level protections in terraform/bootstrap/)
#   - skip_final_snapshot: false (a destroy must always leave a snapshot)
#   - s3 force_destroy: false (a destroy against non-empty media fails
#     loudly instead of silently deleting uploaded covers)
#   - backup_retention_days: 30, not 7

module "route53_acm" {
  source = "../../modules/route53-acm"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  environment        = "prod"
  domain_name        = var.domain_name
  create_hosted_zone = var.create_hosted_zone
}

module "vpc" {
  source = "../../modules/vpc"

  environment        = "prod"
  azs                = var.azs
  single_nat_gateway = true # infrastructure/networking.md — single NAT to start, all envs
}

module "security_groups" {
  source = "../../modules/security-groups"

  environment = "prod"
  vpc_id      = module.vpc.vpc_id
}

module "vpc_endpoints" {
  source = "../../modules/vpc-endpoints"

  environment                      = "prod"
  vpc_id                           = module.vpc.vpc_id
  aws_region                       = var.aws_region
  private_isolated_route_table_ids = [module.vpc.private_isolated_route_table_id]
  private_isolated_subnet_ids      = module.vpc.private_isolated_subnet_ids
  endpoint_security_group_id       = module.security_groups.vpc_endpoints_sg_id
}

module "secrets_manager" {
  source = "../../modules/secrets-manager"

  environment = "prod"
}

module "rds" {
  source = "../../modules/rds"

  environment                 = "prod"
  vpc_id                      = module.vpc.vpc_id
  private_isolated_subnet_ids = module.vpc.private_isolated_subnet_ids
  rds_sg_id                   = module.security_groups.rds_sg_id
  master_username             = module.secrets_manager.rds_master_username
  master_password             = module.secrets_manager.rds_master_password

  instance_class        = "db.t4g.medium" # infrastructure/cost-estimation.md — prod sizing
  multi_az              = false           # no Multi-AZ yet — revisit once uptime requirements justify it
  deletion_protection   = true
  skip_final_snapshot   = false
  backup_retention_days = 30
}

module "rds_proxy" {
  source = "../../modules/rds-proxy"

  environment                 = "prod"
  private_isolated_subnet_ids = module.vpc.private_isolated_subnet_ids
  rds_proxy_sg_id             = module.security_groups.rds_proxy_sg_id
  db_instance_id              = module.rds.db_instance_id
  rds_master_secret_arn       = module.secrets_manager.rds_master_secret_arn
  require_iam_auth            = true
}

module "s3" {
  source = "../../modules/s3"

  environment   = "prod"
  force_destroy = false # never true for prod — runbooks/teardown.md
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  environment                       = "prod"
  domain_name                       = var.domain_name
  cloudfront_certificate_arn        = module.route53_acm.cloudfront_certificate_arn
  hosted_zone_id                    = module.route53_acm.zone_id
  media_bucket_id                   = module.s3.bucket_id
  media_bucket_arn                  = module.s3.bucket_arn
  media_bucket_regional_domain_name = module.s3.bucket_regional_domain_name
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  environment              = "prod"
  domain_name              = var.domain_name
  regional_certificate_arn = module.route53_acm.regional_certificate_arn
  hosted_zone_id           = module.route53_acm.zone_id
}

module "eventbridge" {
  source = "../../modules/eventbridge"

  environment = "prod"
}

module "cloudwatch" {
  source = "../../modules/cloudwatch"

  environment     = "prod"
  rds_instance_id = module.rds.db_instance_id
  rds_proxy_name  = module.rds_proxy.proxy_name
  nat_gateway_ids = module.vpc.nat_gateway_ids
  api_gateway_id  = module.api_gateway.api_id
  alarm_email     = var.alarm_email
}
