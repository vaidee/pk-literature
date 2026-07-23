terraform {
  backend "s3" {
    bucket         = "pk-literature-terraform-state"
    key            = "qa/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "pk-literature-terraform-locks"
    encrypt        = true
  }
}
