const whatsappRoutes = require('./routes/whatsappRoutes');
const { initWorkers } = require('./queues/index');

/**
 * Initialize WhatsApp module - mount routes and start workers.
 * @param {import('express').Express} app
 * @param {object} [options]
 */
function initWhatsAppModule(app, options = {}) {
  app.use('/api/whatsapp', whatsappRoutes);

  if (options.startWorkers !== false && process.env.REDIS_HOST) {
    try {
      initWorkers();
    } catch (err) {
      console.warn('WhatsApp workers failed to start:', err.message);
    }
  }

  console.log('WhatsApp module initialized at /api/whatsapp');
}

module.exports = { initWhatsAppModule };
