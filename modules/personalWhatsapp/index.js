const personalWhatsappRoutes = require('./routes/personalWhatsappRoutes');

function initPersonalWhatsAppModule(app) {
  app.use('/api/personal-whatsapp', personalWhatsappRoutes);
  console.log('Personal WhatsApp (QR) module initialized at /api/personal-whatsapp');
}

module.exports = { initPersonalWhatsAppModule };
