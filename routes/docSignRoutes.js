const express = require('express')
const multer = require('multer')
const authenticateUser = require('../middleware/authenticateUser')
const { authorizeProduct } = require('../middleware/authorizeProduct')
const ctrl = require('../controllers/docSignController')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
})

// Public signing (token-gated) — no auth
router.get('/public/:token', ctrl.getPublicEnvelope)
router.get('/public/:token/file', ctrl.streamPublicFile)
router.get('/public/:token/signed-file', ctrl.streamPublicSignedFile)
router.post('/public/:token/view', ctrl.markPublicViewed)
router.post('/public/:token/sign', ctrl.signPublicEnvelope)
router.post('/public/:token/decline', ctrl.declinePublicEnvelope)

// Authenticated manager APIs
router.use(authenticateUser)
router.use(authorizeProduct('docsign'))

router.get('/mail-status', ctrl.getMailStatus)
router.get('/envelopes', ctrl.listEnvelopes)
router.get('/envelopes/:id', ctrl.getEnvelope)
router.get('/envelopes/:id/file', ctrl.streamEnvelopeFile)
router.get('/envelopes/:id/signed-file', ctrl.streamSignedFile)
router.post('/envelopes', upload.single('file'), ctrl.createEnvelope)
router.put('/envelopes/:id', ctrl.updateEnvelope)
router.post('/envelopes/:id/send', ctrl.sendEnvelope)
router.post('/envelopes/:id/remind', ctrl.remindEnvelope)
router.post('/envelopes/:id/remind/:signerId', ctrl.remindSigner)
router.post('/envelopes/:id/void', ctrl.voidEnvelope)
router.delete('/envelopes/:id', ctrl.deleteEnvelope)

module.exports = router
