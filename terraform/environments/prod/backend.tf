terraform {
  backend "s3" {
    bucket         = "pk-literature-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "pk-literature-terraform-locks"
    encrypt        = true
  }
}
