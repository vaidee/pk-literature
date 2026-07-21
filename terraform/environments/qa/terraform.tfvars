# Placeholder values — set the real domain and alarm email before first
# apply. Sizing matches dev (infrastructure/cost-estimation.md).

aws_region         = "ap-south-1"
domain_name        = "qa.pk-literature.example" # REPLACE before first apply
create_hosted_zone = true
alarm_email        = "alerts+qa@pk-literature.example" # REPLACE before first apply
azs                = ["ap-south-1a", "ap-south-1b"]
