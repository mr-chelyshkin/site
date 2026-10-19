import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

interface PrinterContent {
  home: { contact: { printer: { templates: { id: string }[]; roles: { id: string }[] } } }
}

interface PageContent {
  title: string
  description: string
}

const PAGES: Record<string, string> = {
  '/works/ci-platform': './src/contents/ci-platform.json',
}

const readJson = <T>(path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T

function placeholderPdf(text: string) {
  const content = `BT /F1 20 Tf 72 760 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((object, i) => {
    const at = pdf.length
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`
    return at
  })
  const xref = pdf.length
  const entries = offsets.map((at) => `${String(at).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${entries}`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return pdf
}

function cvApi(): Plugin {
  const { templates, roles } = readJson<PrinterContent>('./src/contents/site.json').home.contact
    .printer
  return {
    name: 'cv-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/cv', (request, response) => {
        const query = new URL(request.url ?? '/', 'http://localhost').searchParams
        const template = query.get('template')
        const role = query.get('role')
        const known = templates.some((t) => t.id === template) && roles.some((r) => r.id === role)
        response.setHeader('cache-control', 'no-store')
        if (!known || !request.headers['x-turnstile-token']) {
          response.statusCode = known ? 401 : 400
          response.end()
          return
        }
        response.setHeader('content-type', 'application/pdf')
        response.end(placeholderPdf(`CV placeholder: ${template}, ${role}`))
      })
    },
  }
}

const escapeAttribute = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

function setTag(html: string, marker: string, attribute: string, value: string) {
  const tag = new RegExp(`<(?:meta|link)\\b[^>]*${marker}[^>]*>`).exec(html)?.[0]
  if (!tag) throw new Error(`page-html: no ${marker} tag in index.html`)
  const updated = tag.replace(
    new RegExp(`${attribute}="[^"]*"`),
    `${attribute}="${escapeAttribute(value)}"`,
  )
  return html.replace(tag, () => updated)
}

function pageHtml(): Plugin {
  const { fullName } = readJson<{ brand: { fullName: string } }>('./src/contents/site.json').brand
  let outDir = ''
  return {
    name: 'page-html',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      const index = readFileSync(join(outDir, 'index.html'), 'utf8')
      const canonical = /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(index)?.[1]
      if (!canonical) throw new Error('page-html: no canonical link in index.html')
      for (const [route, source] of Object.entries(PAGES)) {
        const { title: name, description } = readJson<PageContent>(source)
        const title = `${name} | ${fullName}`
        const url = new URL(route, canonical).href
        let html = index.replace(
          /<title>[^<]*<\/title>/,
          () => `<title>${escapeAttribute(title)}</title>`,
        )
        html = setTag(html, 'rel="canonical"', 'href', url)
        html = setTag(html, 'name="description"', 'content', description)
        html = setTag(html, 'property="og:title"', 'content', title)
        html = setTag(html, 'property="og:description"', 'content', description)
        html = setTag(html, 'property="og:url"', 'content', url)
        html = setTag(html, 'name="twitter:title"', 'content', title)
        html = setTag(html, 'name="twitter:description"', 'content', description)
        const file = join(outDir, `${route}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html)
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), cvApi(), pageHtml()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'vue', test: /node_modules[\\/](?:@vue|vue|vue-router)[\\/]/ }],
        },
      },
    },
  },
})
