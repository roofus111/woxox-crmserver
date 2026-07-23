const fs = require('fs')
const path = require('path')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3')
const { storeCompanyDocument, DOCS_UPLOAD_ROOT, hasS3Config } = require('./uploadFile')

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return Buffer.from(match[2], 'base64')
}

function localCandidatesForUrl(fileUrl) {
  const candidates = []
  if (!fileUrl) return candidates

  if (path.isAbsolute(fileUrl)) {
    candidates.push(fileUrl)
    return candidates
  }

  let pathname = fileUrl
  try {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      pathname = new URL(fileUrl).pathname
    }
  } catch {
    /* keep as-is */
  }

  if (pathname.startsWith('/uploads/')) {
    const rel = pathname.replace(/^\//, '')
    candidates.push(path.join('/app', rel))
    candidates.push(path.join(__dirname, '..', rel))
    // fileuploads live under DOCS_UPLOAD_ROOT which may differ from /uploads mount
    const m = pathname.match(/^\/uploads\/fileuploads\/(.+)$/)
    if (m) {
      candidates.push(path.join(DOCS_UPLOAD_ROOT, m[1]))
    }
    const d = pathname.match(/^\/uploads\/docsign\/(.+)$/)
    if (d) {
      candidates.push(path.join(DOCS_UPLOAD_ROOT, '..', 'docsign', d[1]))
      candidates.push(path.join(DOCS_UPLOAD_ROOT, d[1]))
    }
  }

  return candidates
}

function parseS3Location(fileUrl) {
  if (!fileUrl || !(fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) return null
  try {
    const u = new URL(fileUrl)
    // https://bucket.s3.region.amazonaws.com/key
    const virtual = u.hostname.match(/^(.+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i)
    if (virtual) {
      return { bucket: virtual[1], key: decodeURIComponent(u.pathname.replace(/^\//, '')) }
    }
    // https://s3.region.amazonaws.com/bucket/key
    const pathStyle = u.hostname.match(/^s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i)
    if (pathStyle) {
      const parts = u.pathname.replace(/^\//, '').split('/')
      return { bucket: parts.shift(), key: decodeURIComponent(parts.join('/')) }
    }
  } catch {
    return null
  }
  return null
}

async function fetchFromS3(fileUrl) {
  if (!hasS3Config()) return null
  const loc = parseS3Location(fileUrl)
  if (!loc?.bucket || !loc?.key) return null

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })
  const out = await s3.send(
    new GetObjectCommand({
      Bucket: loc.bucket,
      Key: loc.key
    })
  )
  const chunks = []
  for await (const chunk of out.Body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function fetchPdfBytes(fileUrl) {
  if (!fileUrl) throw new Error('Missing document URL')

  for (const candidate of localCandidatesForUrl(fileUrl)) {
    if (fs.existsSync(candidate)) {
      return fs.promises.readFile(candidate)
    }
  }

  try {
    const fromS3 = await fetchFromS3(fileUrl)
    if (fromS3) return fromS3
  } catch (err) {
    console.warn('[docsign] S3 fetch failed:', err.message)
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error(`Failed to download PDF (${res.status})`)
    return Buffer.from(await res.arrayBuffer())
  }

  throw new Error('Could not load source PDF for signing')
}

async function stampAndStoreSignedPdf(envelope) {
  const sourceBytes = await fetchPdfBytes(envelope.document.fileUrl)
  const pdfDoc = await PDFDocument.load(sourceBytes)
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const field of envelope.fields || []) {
    if (!field.value) continue
    const pageIndex = Math.max(0, (field.page || 1) - 1)
    const page = pages[pageIndex]
    if (!page) continue

    const { width: pageW, height: pageH } = page.getSize()
    const x = (Number(field.x) / 100) * pageW
    const w = (Number(field.width) / 100) * pageW
    const h = (Number(field.height) / 100) * pageH
    const yTop = (Number(field.y) / 100) * pageH
    const y = pageH - yTop - h

    if (field.type === 'signature' || field.type === 'initials') {
      const imgBuf = dataUrlToBuffer(field.value)
      if (!imgBuf) continue
      let image
      try {
        image = await pdfDoc.embedPng(imgBuf)
      } catch {
        try {
          image = await pdfDoc.embedJpg(imgBuf)
        } catch {
          continue
        }
      }
      page.drawImage(image, { x, y, width: w, height: h })
    } else {
      const text = String(field.value).slice(0, 200)
      const fontSize = Math.max(8, Math.min(18, h * 0.55))
      page.drawText(text, {
        x: x + 2,
        y: y + Math.max(2, (h - fontSize) / 2),
        size: fontSize,
        font,
        color: rgb(0.05, 0.05, 0.05),
        maxWidth: w - 4
      })
    }
  }

  const stamped = Buffer.from(await pdfDoc.save())
  const stored = await storeCompanyDocument(
    {
      buffer: stamped,
      originalname: `${(envelope.title || 'signed').replace(/[^a-zA-Z0-9._-]/g, '_')}-signed.pdf`,
      mimetype: 'application/pdf'
    },
    envelope.company,
    'docsign'
  )

  return stored
}

async function getPdfPageCount(fileUrl) {
  try {
    const bytes = await fetchPdfBytes(fileUrl)
    const pdfDoc = await PDFDocument.load(bytes)
    return pdfDoc.getPageCount()
  } catch (err) {
    console.warn('[docsign] page count failed:', err.message)
    return 1
  }
}

module.exports = {
  stampAndStoreSignedPdf,
  getPdfPageCount,
  fetchPdfBytes
}
