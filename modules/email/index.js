const emailRoutes = require('./routes/emailRoutes');
const { initWorkers } = require('./queues/index');

function initEmailModule(app, options = {}) {
  app.use('/api/email', emailRoutes);

  if (options.startWorkers !== false && process.env.REDIS_HOST) {
    try {
      initWorkers();
    } catch (err) {
      console.warn('Email workers failed to start:', err.message);
    }
  }

  console.log('Email Marketing module initialized at /api/email');
}

module.exports = { initEmailModule };
