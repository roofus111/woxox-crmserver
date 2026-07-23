const SignEnvelope = require('../models/SignEnvelope')
const User = require('../models/User')
const { storeCompanyDocument } = require('../utils/uploadFile')
const { stampAndStoreSignedPdf, getPdfPageCount, fetchPdfBytes } = require('../utils/docSignPdf')
const {
  sendSignerInvite,
  sendCompletionNotice,
  sendDeclineNotice,
  checkMailReady,
  signLink
} = require('../utils/docSignMail')

function companyId(req) {
  const c = req.user?.company
  return c?._id || c || req.body?.company
}

function clientIp(req) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress ||
    ''
  )
}

function enrichSigners(envelope) {
  return (envelope.signers || []).map(s => {
    const plain = s.toObject ? s.toObject() : { ...s }
    return {
      ...plain,
      signLink: plain.token ? signLink(plain.token) : null
    }
  })
}

function publicEnvelope(envelope, signer) {
  const myFields = (envelope.fields || [])
    .filter(f => String(f.signerId) === String(signer._id))
    .map(f => ({
      fieldId: f.fieldId,
      type: f.type,
      page: f.page,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      required: f.required,
      label: f.label,
      value: signer.status === 'signed' ? f.value : undefined
    }))

  // Show values already applied by previous signers (sequential trust)
  const overlayFields = (envelope.fields || [])
    .filter(f => {
      if (String(f.signerId) === String(signer._id)) return false
      if (!f.value) return false
      const owner = envelope.signers.id(f.signerId) || envelope.signers.find(s => String(s._id) === String(f.signerId))
      return owner?.status === 'signed'
    })
    .map(f => ({
      fieldId: f.fieldId,
      type: f.type,
      page: f.page,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      label: f.label,
      value: f.value,
      readonly: true
    }))

  return {
    id: envelope._id,
    title: envelope.title,
    message: envelope.message,
    status: envelope.status,
    document: {
      fileUrl: `/api/docsign/public/${signer.token}/file`,
      originalName: envelope.document?.originalName,
      pageCount: envelope.document?.pageCount || 1
    },
    signedDocumentUrl:
      envelope.status === 'completed'
        ? `/api/docsign/public/${signer.token}/signed-file`
        : null,
    signer: {
      id: signer._id,
      name: signer.name,
      email: signer.email,
      status: signer.status,
      order: signer.order
    },
    fields: myFields,
    overlayFields,
    canSign: canSignerAct(envelope, signer),
    waitingReason: !canSignerAct(envelope, signer)
      ? waitingReason(envelope, signer)
      : null
  }
}

function waitingReason(envelope, signer) {
  if (envelope.status === 'completed') return 'This document is already fully signed.'
  if (envelope.status === 'voided') return 'This envelope was voided.'
  if (envelope.status === 'declined') return 'This envelope was declined.'
  if (envelope.status === 'expired' || (envelope.expiresAt && envelope.expiresAt < new Date())) {
    return 'This signing link has expired.'
  }
  if (signer.status === 'signed') return 'You have already signed.'
  if (signer.status === 'declined') return 'You declined this document.'
  if (envelope.signingOrder) {
    const next = nextPendingSigner(envelope)
    if (next && String(next._id) !== String(signer._id)) {
      return `Waiting for ${next.name || next.email} to sign first.`
    }
  }
  if (envelope.status !== 'sent') return 'This envelope is not open for signing yet.'
  return 'You cannot sign this document right now.'
}

function activeSigners(envelope) {
  return (envelope.signers || []).filter(s => s.role === 'signer')
}

function ccRecipients(envelope) {
  return (envelope.signers || []).filter(s => s.role === 'cc')
}

function nextPendingSigner(envelope) {
  const signers = activeSigners(envelope).sort((a, b) => a.order - b.order)
  return signers.find(s => s.status !== 'signed' && s.status !== 'declined') || null
}

function canSignerAct(envelope, signer) {
  if (!['sent'].includes(envelope.status)) return false
  if (signer.role !== 'signer') return false
  if (['signed', 'declined'].includes(signer.status)) return false
  if (envelope.expiresAt && new Date(envelope.expiresAt) < new Date()) return false
  if (!envelope.signingOrder) return true
  const next = nextPendingSigner(envelope)
  return next && String(next._id) === String(signer._id)
}

async function notifyCurrentSigners(envelope, { reminder = false, userId } = {}) {
  const targets = []
  if (envelope.signingOrder) {
    const next = nextPendingSigner(envelope)
    if (next) targets.push(next)
  } else {
    targets.push(
      ...activeSigners(envelope).filter(s => !['signed', 'declined'].includes(s.status))
    )
  }

  const results = []
  for (const signer of targets) {
    if (!signer.token) signer.token = SignEnvelope.newSignerToken()
    if (signer.status === 'pending') signer.status = 'sent'
    const mail = await sendSignerInvite({ envelope, signer, isReminder: reminder, userId })
    if (reminder) {
      signer.lastRemindedAt = new Date()
      signer.reminderCount = (signer.reminderCount || 0) + 1
    }
    results.push({ email: signer.email, name: signer.name, ...mail })
  }
  return results
}

async function notifyCompletion(envelope, userId) {
  const recipients = []
  try {
    const creator = await User.findById(envelope.createdBy).select('email name firstName lastName')
    if (creator?.email) {
      recipients.push({
        email: creator.email,
        name: creator.name || `${creator.firstName || ''} ${creator.lastName || ''}`.trim()
      })
    }
  } catch {
    /* ignore */
  }
  for (const cc of ccRecipients(envelope)) {
    recipients.push({ email: cc.email, name: cc.name })
  }

  const seen = new Set()
  const results = []
  for (const r of recipients) {
    const key = String(r.email).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    results.push(
      await sendCompletionNotice({
        envelope,
        recipient: r,
        signedUrl: envelope.signedDocument?.fileUrl,
        userId
      })
    )
  }
  return results
}

async function maybeCompleteEnvelope(envelope, req) {
  const signers = activeSigners(envelope)
  if (!signers.length) return false
  if (!signers.every(s => s.status === 'signed')) return false

  const stored = await stampAndStoreSignedPdf(envelope)
  envelope.signedDocument = {
    fileName: stored.fileName,
    fileUrl: stored.fileUrl
  }
  envelope.status = 'completed'
  envelope.completedAt = new Date()
  envelope.pushAudit({
    action: 'completed',
    actorEmail: 'system',
    actorName: 'Doc Sign',
    ip: clientIp(req),
    meta: { signedUrl: stored.fileUrl }
  })
  await envelope.save()
  try {
    await notifyCompletion(envelope, req.user?._id)
  } catch (err) {
    console.error('[docsign] completion notice failed', err.message)
  }
  return true
}

async function streamPdf(res, fileUrl, downloadName) {
  const bytes = await fetchPdfBytes(fileUrl)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Length', bytes.length)
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${(downloadName || 'document.pdf').replace(/"/g, '')}"`
  )
  res.setHeader('Cache-Control', 'private, max-age=60')
  return res.send(bytes)
}

exports.getMailStatus = async (req, res) => {
  try {
    const status = await checkMailReady(companyId(req))
    res.json(status)
  } catch (error) {
    res.status(500).json({ ready: false, message: error.message })
  }
}

exports.listEnvelopes = async (req, res) => {
  try {
    const cid = companyId(req)
    const { status, q } = req.query
    const filter = { company: cid }
    if (status) filter.status = status
    if (q) filter.title = { $regex: String(q), $options: 'i' }

    const items = await SignEnvelope.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .select('-audit')
      .lean()

    res.json({
      items: items.map(item => ({
        ...item,
        signers: (item.signers || []).map(s => ({
          ...s,
          signLink: s.token ? signLink(s.token) : null
        })),
        signerSummary: {
          total: (item.signers || []).filter(s => s.role === 'signer').length,
          signed: (item.signers || []).filter(s => s.status === 'signed').length,
          pending: (item.signers || []).filter(
            s => s.role === 'signer' && !['signed', 'declined'].includes(s.status)
          ).length
        }
      }))
    })
  } catch (error) {
    console.error('listEnvelopes', error)
    res.status(500).json({ message: error.message || 'Failed to list envelopes' })
  }
}

exports.getEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' })
    const json = envelope.toObject()
    json.signers = enrichSigners(envelope)
    json.documentProxyUrl = `/api/docsign/envelopes/${envelope._id}/file`
    json.signedProxyUrl = envelope.signedDocument?.fileUrl
      ? `/api/docsign/envelopes/${envelope._id}/signed-file`
      : null
    const mail = await checkMailReady(companyId(req))
    json.mailStatus = mail
    res.json(json)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load envelope' })
  }
}

exports.createEnvelope = async (req, res) => {
  try {
    const cid = companyId(req)
    const file = req.file
    if (!file) return res.status(400).json({ message: 'PDF file is required' })
    if (!String(file.mimetype || '').includes('pdf') && !/\.pdf$/i.test(file.originalname || '')) {
      return res.status(400).json({ message: 'Only PDF documents are supported' })
    }

    const title = (req.body.title || file.originalname || 'Untitled').trim()
    let signers = []
    try {
      signers = JSON.parse(req.body.signers || '[]')
    } catch {
      return res.status(400).json({ message: 'Invalid signers payload' })
    }

    if (!Array.isArray(signers) || !signers.length) {
      return res.status(400).json({ message: 'At least one signer is required' })
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const s of signers) {
      if (!s.name?.trim() || !emailOk.test(String(s.email || ''))) {
        return res.status(400).json({ message: 'Each recipient needs a valid name and email' })
      }
    }

    if (!signers.some(s => (s.role || 'signer') === 'signer')) {
      return res.status(400).json({ message: 'Add at least one signer (not only CC)' })
    }

    const stored = await storeCompanyDocument(file, cid, 'docsign')
    const pageCount = await getPdfPageCount(stored.fileUrl)

    const envelope = new SignEnvelope({
      company: cid,
      createdBy: req.user._id,
      title,
      message: req.body.message || '',
      signingOrder: String(req.body.signingOrder ?? 'true') !== 'false',
      reminder: {
        enabled: String(req.body.reminderEnabled ?? 'true') !== 'false',
        intervalDays: Number(req.body.reminderIntervalDays || 3),
        maxReminders: Number(req.body.maxReminders || 5)
      },
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      leadId: req.body.leadId || undefined,
      document: {
        fileName: stored.fileName,
        fileType: stored.fileType,
        fileUrl: stored.fileUrl,
        originalName: file.originalname,
        pageCount
      },
      signers: signers.map((s, idx) => ({
        name: s.name.trim(),
        email: String(s.email || '').toLowerCase().trim(),
        role: s.role === 'cc' ? 'cc' : 'signer',
        order: Number(s.order || idx + 1),
        status: 'pending',
        token: SignEnvelope.newSignerToken()
      }))
    })

    envelope.pushAudit({
      action: 'created',
      actorEmail: req.user.email,
      actorName: req.user.name || req.user.username,
      ip: clientIp(req)
    })

    await envelope.save()
    const json = envelope.toObject()
    json.signers = enrichSigners(envelope)
    json.documentProxyUrl = `/api/docsign/envelopes/${envelope._id}/file`
    json.mailStatus = await checkMailReady(cid)
    res.status(201).json(json)
  } catch (error) {
    console.error('createEnvelope', error)
    res.status(500).json({ message: error.message || 'Failed to create envelope' })
  }
}

exports.updateEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' })
    if (envelope.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft envelopes can be edited' })
    }

    const { title, message, fields, signers, signingOrder, reminder, expiresAt, documentPageCount } =
      req.body

    if (title != null) envelope.title = String(title).trim()
    if (message != null) envelope.message = String(message)
    if (signingOrder != null) envelope.signingOrder = Boolean(signingOrder)
    if (reminder) {
      envelope.reminder = {
        ...(envelope.reminder?.toObject?.() || envelope.reminder || {}),
        ...reminder
      }
    }
    if (expiresAt !== undefined) {
      envelope.expiresAt = expiresAt ? new Date(expiresAt) : undefined
    }
    if (documentPageCount) {
      envelope.document.pageCount = Number(documentPageCount)
    }

    if (Array.isArray(signers)) {
      envelope.signers = signers.map((s, idx) => ({
        _id: s._id,
        name: s.name,
        email: String(s.email || '').toLowerCase().trim(),
        role: s.role === 'cc' ? 'cc' : 'signer',
        order: Number(s.order || idx + 1),
        status: s.status || 'pending',
        token: s.token || SignEnvelope.newSignerToken()
      }))
    }

    if (Array.isArray(fields)) {
      const signerIds = new Set(envelope.signers.map(s => String(s._id)))
      envelope.fields = fields.map(f => {
        if (!signerIds.has(String(f.signerId))) {
          throw new Error('Field references unknown signer')
        }
        return {
          fieldId: f.fieldId || `fld_${Math.random().toString(36).slice(2, 10)}`,
          type: f.type,
          signerId: f.signerId,
          page: Number(f.page || 1),
          x: Number(f.x),
          y: Number(f.y),
          width: Number(f.width),
          height: Number(f.height),
          required: f.required !== false,
          label: f.label || f.type,
          value: f.value || ''
        }
      })
    }

    envelope.pushAudit({
      action: 'updated',
      actorEmail: req.user.email,
      actorName: req.user.name || req.user.username,
      ip: clientIp(req)
    })

    await envelope.save()
    const json = envelope.toObject()
    json.signers = enrichSigners(envelope)
    json.documentProxyUrl = `/api/docsign/envelopes/${envelope._id}/file`
    res.json(json)
  } catch (error) {
    console.error('updateEnvelope', error)
    res.status(400).json({ message: error.message || 'Failed to update envelope' })
  }
}

exports.sendEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' })
    if (!['draft', 'sent'].includes(envelope.status)) {
      return res.status(400).json({ message: 'Envelope cannot be sent in its current status' })
    }

    const signers = activeSigners(envelope)
    if (!signers.length) return res.status(400).json({ message: 'Add at least one signer' })
    if (!(envelope.fields || []).length) {
      return res.status(400).json({ message: 'Place at least one signature field before sending' })
    }

    for (const signer of signers) {
      const hasField = envelope.fields.some(f => String(f.signerId) === String(signer._id))
      if (!hasField) {
        return res.status(400).json({
          message: `Place at least one field for signer ${signer.name || signer.email}`
        })
      }
      if (!signer.token) signer.token = SignEnvelope.newSignerToken()
    }

    const mailReady = await checkMailReady(companyId(req))
    envelope.status = 'sent'
    envelope.sentAt = envelope.sentAt || new Date()
    const mailResults = await notifyCurrentSigners(envelope, {
      reminder: false,
      userId: req.user._id
    })

    envelope.pushAudit({
      action: 'sent',
      actorEmail: req.user.email,
      actorName: req.user.name || req.user.username,
      ip: clientIp(req),
      meta: {
        recipients: mailResults.map(r => r.email),
        mailOk: mailResults.filter(r => r.sent).length,
        mailFailed: mailResults.filter(r => !r.sent).length
      }
    })

    await envelope.save()
    const json = envelope.toObject()
    json.signers = enrichSigners(envelope)
    res.json({
      envelope: json,
      mailResults,
      mailStatus: mailReady,
      warning: mailResults.some(r => !r.sent)
        ? 'Some emails could not be sent. Copy the signing links below and share them manually.'
        : null
    })
  } catch (error) {
    console.error('sendEnvelope', error)
    res.status(500).json({ message: error.message || 'Failed to send envelope' })
  }
}

exports.remindEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' })
    if (envelope.status !== 'sent') {
      return res.status(400).json({ message: 'Reminders only apply to sent envelopes' })
    }

    const mailResults = await notifyCurrentSigners(envelope, {
      reminder: true,
      userId: req.user._id
    })
    envelope.pushAudit({
      action: 'reminder_sent',
      actorEmail: req.user.email,
      actorName: req.user.name || req.user.username,
      ip: clientIp(req),
      meta: { recipients: mailResults.map(r => r.email) }
    })
    await envelope.save()
    const json = envelope.toObject()
    json.signers = enrichSigners(envelope)
    res.json({
      envelope: json,
      mailResults,
      warning: mailResults.some(r => !r.sent)
        ? 'Reminder email failed for some recipients. Use copy-link instead.'
        : null
    })
  } catch (error) {
    console.error('remindEnvelope', error)
    res.status(500).json({ message: error.message || 'Failed to send reminders' })
  }
}

exports.remindSigner = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' })
    if (envelope.status !== 'sent') {
      return res.status(400).json({ message: 'Envelope is not open for reminders' })
    }
    const signer = envelope.signers.id(req.params.signerId)
    if (!signer || signer.role !== 'signer') {
      return res.status(404).json({ message: 'Signer not found' })
    }
    if (['signed', 'declined'].includes(signer.status)) {
      return res.status(400).json({ message: 'Signer already finished' })
    }
    if (!signer.token) signer.token = SignEnvelope.newSignerToken()
    const mail = await sendSignerInvite({
      envelope,
      signer,
      isReminder: true,
      userId: req.user._id
    })
    signer.lastRemindedAt = new Date()
    signer.reminderCount = (signer.reminderCount || 0) + 1
    if (signer.status === 'pending') signer.status = 'sent'
    envelope.pushAudit({
      action: 'reminder_sent',
      actorEmail: req.user.email,
      actorName: req.user.name || req.user.username,
      ip: clientIp(req),
      meta: { email: signer.email }
    })
    await envelope.save()
    res.json({
      mailResult: mail,
      signer: { ...signer.toObject(), signLink: signLink(signer.token) },
      warning: mail.sent ? null : mail.error || 'Email failed — copy the signing link'
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remind signer' })
  }
}

exports.voidEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' })
    if (['completed', 'voided'].includes(envelope.status)) {
      return res.status(400).json({ message: 'Envelope cannot be voided' })
    }

    envelope.status = 'voided'
    envelope.pushAudit({
      action: 'voided',
      actorEmail: req.user.email,
      actorName: req.user.name || req.user.username,
      ip: clientIp(req),
      meta: { reason: req.body.reason || '' }
    })
    await envelope.save()
    const json = envelope.toObject()
    json.signers = enrichSigners(envelope)
    res.json(json)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to void envelope' })
  }
}

exports.deleteEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' })
    if (envelope.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft envelopes can be deleted' })
    }
    await envelope.deleteOne()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete envelope' })
  }
}

exports.streamEnvelopeFile = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope?.document?.fileUrl) return res.status(404).json({ message: 'Document not found' })
    await streamPdf(res, envelope.document.fileUrl, envelope.document.originalName || 'document.pdf')
  } catch (error) {
    console.error('streamEnvelopeFile', error)
    res.status(500).json({ message: error.message || 'Failed to load PDF' })
  }
}

exports.streamSignedFile = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({
      _id: req.params.id,
      company: companyId(req)
    })
    if (!envelope?.signedDocument?.fileUrl) {
      return res.status(404).json({ message: 'Signed PDF not ready' })
    }
    await streamPdf(res, envelope.signedDocument.fileUrl, `${envelope.title || 'signed'}.pdf`)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load signed PDF' })
  }
}

exports.streamPublicFile = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({ 'signers.token': req.params.token })
    if (!envelope?.document?.fileUrl) return res.status(404).json({ message: 'Document not found' })
    await streamPdf(res, envelope.document.fileUrl, envelope.document.originalName || 'document.pdf')
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load PDF' })
  }
}

exports.streamPublicSignedFile = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({ 'signers.token': req.params.token })
    if (!envelope || envelope.status !== 'completed' || !envelope.signedDocument?.fileUrl) {
      return res.status(404).json({ message: 'Signed PDF not available' })
    }
    await streamPdf(res, envelope.signedDocument.fileUrl, `${envelope.title || 'signed'}.pdf`)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load signed PDF' })
  }
}

exports.getPublicEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({ 'signers.token': req.params.token })
    if (!envelope) return res.status(404).json({ message: 'Signing link not found' })

    if (envelope.status === 'voided') {
      return res.status(410).json({ message: 'This envelope was voided' })
    }
    if (envelope.status === 'expired' || (envelope.expiresAt && envelope.expiresAt < new Date())) {
      if (envelope.status !== 'expired') {
        envelope.status = 'expired'
        await envelope.save()
      }
      return res.status(410).json({ message: 'This signing link has expired' })
    }

    const signer = envelope.signers.find(s => s.token === req.params.token)
    if (!signer) return res.status(404).json({ message: 'Signer not found' })

    res.json(publicEnvelope(envelope, signer))
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load signing session' })
  }
}

exports.markPublicViewed = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({ 'signers.token': req.params.token })
    if (!envelope) return res.status(404).json({ message: 'Signing link not found' })
    if (['voided', 'expired', 'declined'].includes(envelope.status)) {
      return res.status(410).json({ message: `This envelope is ${envelope.status}` })
    }
    if (envelope.expiresAt && envelope.expiresAt < new Date()) {
      envelope.status = 'expired'
      await envelope.save()
      return res.status(410).json({ message: 'This signing link has expired' })
    }

    const signer = envelope.signers.find(s => s.token === req.params.token)
    if (!signer) return res.status(404).json({ message: 'Signer not found' })

    if (envelope.status === 'sent' && (signer.status === 'sent' || signer.status === 'pending')) {
      signer.status = 'viewed'
      signer.viewedAt = new Date()
      envelope.pushAudit({
        action: 'viewed',
        actorEmail: signer.email,
        actorName: signer.name,
        ip: clientIp(req)
      })
      await envelope.save()
    }

    res.json(publicEnvelope(envelope, signer))
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to record view' })
  }
}

exports.signPublicEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({ 'signers.token': req.params.token })
    if (!envelope) return res.status(404).json({ message: 'Signing link not found' })
    const signer = envelope.signers.find(s => s.token === req.params.token)
    if (!signer) return res.status(404).json({ message: 'Signer not found' })

    if (!canSignerAct(envelope, signer)) {
      return res.status(400).json({
        message: waitingReason(envelope, signer)
      })
    }

    const values = Array.isArray(req.body.fields) ? req.body.fields : []
    const myFields = envelope.fields.filter(f => String(f.signerId) === String(signer._id))

    for (const field of myFields) {
      if (!field.required) continue
      const provided = values.find(v => v.fieldId === field.fieldId)
      if (!provided?.value) {
        return res.status(400).json({ message: `Missing required field: ${field.label || field.type}` })
      }
    }

    for (const field of myFields) {
      const provided = values.find(v => v.fieldId === field.fieldId)
      if (provided?.value != null) field.value = String(provided.value)
    }

    signer.status = 'signed'
    signer.signedAt = new Date()
    signer.ipAddress = clientIp(req)
    signer.userAgent = req.headers['user-agent'] || ''

    envelope.pushAudit({
      action: 'signed',
      actorEmail: signer.email,
      actorName: signer.name,
      ip: clientIp(req)
    })

    await envelope.save()

    const completed = await maybeCompleteEnvelope(envelope, req)
    if (!completed && envelope.signingOrder) {
      try {
        await notifyCurrentSigners(envelope, { reminder: false })
        await envelope.save()
      } catch (err) {
        console.error('[docsign] next signer notify failed', err.message)
      }
    }

    const fresh = await SignEnvelope.findById(envelope._id)
    const freshSigner = fresh.signers.find(s => s.token === req.params.token)
    res.json(publicEnvelope(fresh, freshSigner))
  } catch (error) {
    console.error('signPublicEnvelope', error)
    res.status(500).json({ message: error.message || 'Failed to sign document' })
  }
}

exports.declinePublicEnvelope = async (req, res) => {
  try {
    const envelope = await SignEnvelope.findOne({ 'signers.token': req.params.token })
    if (!envelope) return res.status(404).json({ message: 'Signing link not found' })
    const signer = envelope.signers.find(s => s.token === req.params.token)
    if (!signer) return res.status(404).json({ message: 'Signer not found' })

    if (signer.status === 'signed') {
      return res.status(400).json({ message: 'Already signed' })
    }

    signer.status = 'declined'
    signer.declinedAt = new Date()
    signer.declineReason = req.body.reason || ''
    envelope.status = 'declined'
    envelope.pushAudit({
      action: 'declined',
      actorEmail: signer.email,
      actorName: signer.name,
      ip: clientIp(req),
      meta: { reason: signer.declineReason }
    })
    await envelope.save()

    try {
      const creator = await User.findById(envelope.createdBy).select('email name firstName lastName')
      if (creator?.email) {
        await sendDeclineNotice({
          envelope,
          signer,
          reason: signer.declineReason,
          creatorEmail: creator.email,
          creatorName: creator.name || `${creator.firstName || ''} ${creator.lastName || ''}`.trim()
        })
      }
    } catch (err) {
      console.error('[docsign] decline notice failed', err.message)
    }

    res.json(publicEnvelope(envelope, signer))
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to decline' })
  }
}

exports.runReminderJob = async () => {
  const now = new Date()
  const envelopes = await SignEnvelope.find({
    status: 'sent',
    'reminder.enabled': true
  }).limit(100)

  for (const envelope of envelopes) {
    try {
      if (envelope.expiresAt && envelope.expiresAt < now) {
        envelope.status = 'expired'
        envelope.pushAudit({ action: 'expired', actorEmail: 'system', actorName: 'Doc Sign' })
        await envelope.save()
        continue
      }

      const intervalMs = (envelope.reminder?.intervalDays || 3) * 24 * 60 * 60 * 1000
      const max = envelope.reminder?.maxReminders || 5
      const targets = envelope.signingOrder
        ? [nextPendingSigner(envelope)].filter(Boolean)
        : activeSigners(envelope).filter(s => !['signed', 'declined'].includes(s.status))

      let changed = false
      for (const signer of targets) {
        if (!signer) continue
        if ((signer.reminderCount || 0) >= max) continue
        const last = signer.lastRemindedAt || envelope.sentAt || envelope.createdAt
        if (last && now - new Date(last) < intervalMs) continue
        if (!signer.token) signer.token = SignEnvelope.newSignerToken()
        await sendSignerInvite({ envelope, signer, isReminder: true })
        signer.lastRemindedAt = now
        signer.reminderCount = (signer.reminderCount || 0) + 1
        changed = true
      }
      if (changed) {
        envelope.pushAudit({
          action: 'auto_reminder',
          actorEmail: 'system',
          actorName: 'Doc Sign'
        })
        await envelope.save()
      }
    } catch (err) {
      console.error('docsign reminder job item failed', envelope._id, err.message)
    }
  }
}
