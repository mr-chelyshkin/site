terraform {
  required_version = "= 1.15.9"

  backend "s3" {}

  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "= 2.8.1"
    }

    aws = {
      source  = "hashicorp/aws"
      version = "6.69.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}
