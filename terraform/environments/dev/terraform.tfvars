# Placeholder values — set the real domain and alarm email before first
# apply. Everything else uses the module defaults sized for dev
# (infrastructure/cost-estimation.md).

aws_region         = "ap-south-1"
domain_name        = "dev.pk-literature.example" # REPLACE before first apply
create_hosted_zone = true
alarm_email        = "alerts+dev@pk-literature.example" # REPLACE before first apply
azs                = ["ap-south-1a", "ap-south-1b"]
