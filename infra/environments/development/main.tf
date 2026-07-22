provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.required_tags
  }
}

locals {
  name_prefix = "summitodoro-development"
  required_tags = {
    application = "summitodoro"
    environment = "development"
    owner       = var.owner
    managed-by  = "terraform"
    cost-center = var.cost_center
  }
}

module "vpc" {
  source = "../../modules/vpc"

  name_prefix          = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  tags                 = local.required_tags
}

module "ecr" {
  source      = "../../modules/ecr"
  name_prefix = local.name_prefix
  tags        = local.required_tags
}

module "observability" {
  source                = "../../modules/observability"
  name_prefix           = local.name_prefix
  log_retention_in_days = 30
  tags                  = local.required_tags
}
