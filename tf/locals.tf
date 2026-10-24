locals {
  domain_labels        = split(".", var.domain_name)
  name_prefix          = join("-", reverse(slice(local.domain_labels, 0, length(local.domain_labels) - 1)))
  cloudfront_origin_id = "s3-${var.site_bucket_name}"

  cv_name        = "${local.name_prefix}-cv"
  cv_bucket_name = "${var.site_bucket_name}-cv"
  cv_origin_id   = "lambda-${local.cv_name}"
  cv_concurrency = 2

  turnstile_secret_parameter = "/${local.name_prefix}/turnstile-secret"
  turnstile_secret_version   = 1

  content_security_policy = join("; ", [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self' https://cloudflareinsights.com",
    "font-src 'self' https://fonts.gstatic.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src https://challenges.cloudflare.com",
    "img-src 'self' data:",
    "media-src 'self'",
    "object-src 'none'",
    "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  ])

  tags = {
    ManagedBy  = "Terraform"
    Project    = "mr-chelyshkin-site"
    Repository = "mr-chelyshkin/site"
    Site       = var.domain_name
  }
}
