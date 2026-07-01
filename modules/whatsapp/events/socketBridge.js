let ioInstance = null;

/**
 * Bridge to access Socket.IO instance from WhatsApp module.
 * @param {import('socket.io').Server} io
 */
function setIO(io) {
  ioInstance = io;
}

/**
 * @returns {import('socket.io').Server|null}
 */
function getIO() {
  return ioInstance;
}

module.exports = { setIO, getIO };
