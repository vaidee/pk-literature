variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "domain_name" {
  description = "Placeholder — set the real domain before first apply."
  type        = string
  default     = "qa.pk-literature.example"
}

variable "create_hosted_zone" {
  type    = bool
  default = true
}

variable "alarm_email" {
  description = "Placeholder — set before first apply."
  type        = string
  default     = "alerts+qa@pk-literature.example"
}

variable "azs" {
  type    = list(string)
  default = ["ap-south-1a", "ap-south-1b"]
}

variable "directus_image_tag" {
  description = "Tag mirrored into pk-literature/directus by .github/workflows/mirror-directus-image.yml — matches apps/directus/Dockerfile's pinned base."
  type        = string
  default     = "11.17.4"
}
