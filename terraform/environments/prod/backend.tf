terraform {
  backend "s3" {
    bucket         = "pk-literature-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "pk-literature-terraform-locks"
    encrypt        = true
  }
}
