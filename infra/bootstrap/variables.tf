variable "aws_region" {
  type        = string
  description = "AWS region for the state bucket."
}

variable "aws_account_id" {
  type        = string
  description = "AWS account ID that owns the Terraform state bucket."
}

variable "state_bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name for Terraform state."
}

variable "terraform_role_arns" {
  type        = list(string)
  description = "Only these IAM role ARNs may read or write Terraform state."
}

variable "tags" {
  type        = map(string)
  description = "Required Terraform resource tags."
}
