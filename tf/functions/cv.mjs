import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

const TEMPLATES = ['one-page', 'classic']
const ROLES = ['platform', 'sre', 'devops']

const s3 = new S3Client()
const ssm = new SSMClient()

let secret
async function turnstileSecret() {
  secret ??= (
    await ssm.send(
      new GetParameterCommand({
        Name: process.env.TURNSTILE_SECRET_PARAMETER,
        WithDecryption: true,
      }),
    )
  ).Parameter.Value
  return secret
}

const OUR_FAULT = ['missing-input-secret', 'invalid-input-secret', 'bad-request', 'internal-error']

async function vouched(token) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: await turnstileSecret(), response: token }),
    signal: AbortSignal.timeout(4000),
  })
  if (!response.ok) throw new Error(`Turnstile answered ${response.status}`)
  const verdict = await response.json()
  const codes = verdict['error-codes'] ?? []
  if (codes.some((code) => OUR_FAULT.includes(code))) {
    secret = undefined
    throw new Error(`Turnstile refused the check: ${codes.join(', ')}`)
  }
  if (!verdict.success) {
    console.warn(`Turnstile did not vouch: ${codes.join(', ') || 'no reason given'}`)
    return false
  }
  if (verdict.hostname !== process.env.SITE_HOSTNAME || verdict.action !== 'cv') {
    console.warn(`Turnstile vouched for ${verdict.hostname}, action ${verdict.action}`)
    return false
  }
  return true
}

const reply = (statusCode, message) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify({ message }),
})

export async function handler(event) {
  const { template, role } = event.queryStringParameters ?? {}
  if (!TEMPLATES.includes(template) || !ROLES.includes(role)) {
    return reply(400, 'No such template or role.')
  }
  const token = event.headers?.['x-turnstile-token']
  if (!token) return reply(401, 'No Turnstile token.')

  try {
    if (!(await vouched(token))) return reply(401, 'Turnstile did not vouch for this request.')
    const pdf = await s3.send(
      new GetObjectCommand({ Bucket: process.env.CV_BUCKET, Key: `${template}-${role}.pdf` }),
    )
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/pdf', 'cache-control': 'no-store' },
      body: await pdf.Body.transformToString('base64'),
      isBase64Encoded: true,
    }
  } catch (error) {
    console.error(error)
    return reply(502, 'The printer jammed.')
  }
}
