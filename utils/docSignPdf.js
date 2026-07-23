const fs = require('fs')
const path = require('path')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')
const { storeCompanyDocument } = require('./uploadFile')

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return Buffer.from(match[2], 'base64')
}

async function fetchPdfBytes(fileUrl) {
  if (!fileUrl) throw new Error('Missing document URL')

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error(`Failed to download PDF (${res.status})`)
    return Buffer.from(await res.arrayBuffer())
  }

  const localCandidates = []
  if (fileUrl.startsWith('/uploads/')) {
    localCandidates.push(path.join(__dirname, '..', fileUrl.replace(/^\//, '')))
    localCandidates.push(path.join('/app', fileUrl.replace(/^\//, '')))
  } else if (path.isAbsolute(fileUrl)) {
    localCandidates.push(fileUrl)
  }

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      return fs.promises.readFile(candidate)
    }
  }

  throw new Error('Could not load source PDF for signing')
}

/**
 * Stamp completed field values onto the source PDF and store the signed copy.
 */
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
  } catch {
    return 1
  }
}

module.exports = {
  stampAndStoreSignedPdf,
  getPdfPageCount,
  fetchPdfBytes
}
