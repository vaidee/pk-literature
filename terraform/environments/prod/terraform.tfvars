# Placeholder values — set the real domain and alarm email before first
# apply. Sizing/safety flags are prod-specific (see main.tf header
# comment and infrastructure/cost-estimation.md).

aws_region         = "ap-south-1"
domain_name        = "pk-literature.example" # REPLACE before first apply
create_hosted_zone = true
alarm_email        = "alerts@pk-literature.example" # REPLACE before first apply
azs                = ["ap-south-1a", "ap-south-1b"]
