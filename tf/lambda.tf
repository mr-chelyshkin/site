data "aws_caller_identity" "current" {}

data "archive_file" "cv" {
  type        = "zip"
  source_file = "${path.module}/functions/cv.mjs"
  output_path = "${path.module}/.build/cv.zip"
}

data "aws_iam_policy_document" "cv_function" {
  statement {
    sid       = "ReadPdfs"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.cv.arn}/*"]
  }

  statement {
    sid       = "ReadTurnstileSecret"
    actions   = ["ssm:GetParameter"]
    resources = [aws_ssm_parameter.turnstile_secret.arn]
  }

  statement {
    sid       = "DecryptTurnstileSecret"
    actions   = ["kms:Decrypt"]
    resources = ["arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.aws_region}.amazonaws.com"]
    }
  }

  statement {
    sid       = "WriteLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.cv.arn}:*"]
  }
}

resource "aws_lambda_function" "cv" {
  function_name = local.cv_name
  description   = "Hands out the CV PDFs for ${var.domain_name}"
  role          = aws_iam_role.cv.arn
  runtime       = "nodejs24.x"
  architectures = ["arm64"]
  handler       = "cv.handler"
  memory_size   = 128
  timeout       = 10

  filename         = data.archive_file.cv.output_path
  source_code_hash = data.archive_file.cv.output_base64sha256

  reserved_concurrent_executions = local.cv_concurrency

  environment {
    variables = {
      CV_BUCKET                  = aws_s3_bucket.cv.id
      SITE_HOSTNAME              = var.domain_name
      TURNSTILE_SECRET_PARAMETER = aws_ssm_parameter.turnstile_secret.name
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.cv.name
  }

  depends_on = [aws_iam_role_policy.cv]
}

resource "aws_cloudwatch_log_group" "cv" {
  name              = "/aws/lambda/${local.cv_name}"
  retention_in_days = 14
}

resource "aws_ssm_parameter" "turnstile_secret" {
  name             = local.turnstile_secret_parameter
  type             = "SecureString"
  value_wo         = var.turnstile_secret_key
  value_wo_version = local.turnstile_secret_version
}

resource "aws_lambda_function_url" "cv" {
  function_name      = aws_lambda_function.cv.function_name
  authorization_type = "AWS_IAM"
}

resource "aws_lambda_permission" "cv_url" {
  statement_id           = "AllowCloudFrontInvokeFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.cv.function_name
  function_url_auth_type = "AWS_IAM"
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.site.arn
}

resource "aws_lambda_permission" "cv_invoke" {
  statement_id             = "AllowCloudFrontInvokeFunction"
  action                   = "lambda:InvokeFunction"
  principal                = "cloudfront.amazonaws.com"
  function_name            = aws_lambda_function.cv.function_name
  source_arn               = aws_cloudfront_distribution.site.arn
  invoked_via_function_url = true
}

data "aws_iam_policy_document" "cv_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cv" {
  name                 = local.cv_name
  description          = "The CV function for ${var.domain_name}"
  assume_role_policy   = data.aws_iam_policy_document.cv_assume_role.json
  permissions_boundary = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${local.cv_name}-boundary"
}

resource "aws_iam_role_policy" "cv" {
  name   = local.cv_name
  role   = aws_iam_role.cv.id
  policy = data.aws_iam_policy_document.cv_function.json
}
