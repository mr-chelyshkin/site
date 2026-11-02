variable "aws_region" {
  description = "Bucket AWS region"
  type        = string
  nullable    = false
}

variable "domain_name" {
  description = "Hostname"
  type        = string
  nullable    = false
}

variable "site_bucket_name" {
  description = "Static S3 bucket name"
  type        = string
  nullable    = false
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  nullable    = false
}

variable "turnstile_secret_key" {
  description = "Cloudflare Turnstile secret key."
  type        = string
  sensitive   = true
  ephemeral   = true
  nullable    = false
}
