variable "name_prefix" { type = string }
variable "log_retention_in_days" { type = number }
variable "tags" { type = map(string) }

resource "aws_cloudwatch_log_group" "application" {
  name              = "/summitodoro/${var.name_prefix}"
  retention_in_days = var.log_retention_in_days
  tags              = var.tags
}
