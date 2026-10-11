import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

interface PrinterContent {
  home: { contact: { printer: { templates: { id: string }[]; roles: { id: string }[] } } }
}

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
  const content = readFileSync(new URL('./src/contents/site.json', import.meta.url), 'utf8')
  const { templates, roles } = (JSON.parse(content) as PrinterContent).home.contact.printer
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

export default defineConfig({
  plugins: [vue(), cvApi()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router'],
        },
      },
    },
  },
})
