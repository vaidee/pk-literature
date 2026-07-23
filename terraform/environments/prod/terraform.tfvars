# Placeholder values — set the real domain and alarm email before first
# apply. Sizing/safety flags are prod-specific (see main.tf header
# comment and infrastructure/cost-estimation.md).

aws_region         = "ap-south-1"
domain_name        = "pk-literature.example" # REPLACE before first apply
create_hosted_zone = true
alarm_email        = "alerts@pk-literature.example" # REPLACE before first apply
azs                = ["ap-south-1a", "ap-south-1b"]

# Reusing this account's existing VPC (modules/vpc's create_vpc = false
# mode, main.tf) instead of provisioning a new one — see
# variables.tf's comment for how to pull the real values.
existing_vpc_id                          = "vpc-REPLACE_ME"                                                 # REPLACE before first apply
existing_public_subnet_ids               = ["subnet-REPLACE_ME_PUBLIC_1", "subnet-REPLACE_ME_PUBLIC_2"]     # REPLACE before first apply
existing_private_isolated_subnet_ids     = ["subnet-REPLACE_ME_ISOLATED_1", "subnet-REPLACE_ME_ISOLATED_2"] # REPLACE before first apply
existing_private_nat_subnet_ids          = ["subnet-REPLACE_ME_NAT_1", "subnet-REPLACE_ME_NAT_2"]           # REPLACE before first apply
existing_private_isolated_route_table_id = "rtb-REPLACE_ME"                                                 # REPLACE before first apply
existing_nat_gateway_ids                 = []                                                               # optional — see variables.tf
