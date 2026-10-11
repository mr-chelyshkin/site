output "site_bucket_name" {
  description = "S3 bucket receiving the built site."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution invalidated after each deployment."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.site.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID."
  value       = aws_cloudfront_distribution.site.hosted_zone_id
}

output "cv_bucket_name" {
  description = "S3 bucket receiving the CV PDFs."
  value       = aws_s3_bucket.cv.id
}

output "cv_function_name" {
  description = "Lambda function handing out the CV PDFs."
  value       = aws_lambda_function.cv.function_name
}
