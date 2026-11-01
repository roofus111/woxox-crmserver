const jwt = require('jsonwebtoken');

function extractToken(socket) {
  const fromAuth = socket.handshake?.auth?.token;
  if (fromAuth) return String(fromAuth);
  const header = socket.handshake?.headers?.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

// Connection-level auth: a valid access token is required to open a socket.
// Set SOCKET_AUTH_REQUIRED=false only as a temporary rollout escape hatch.
function socketAuth(socket, next) {
  if (String(process.env.SOCKET_AUTH_REQUIRED || 'true').toLowerCase() === 'false') {
    return next();
  }
  const token = extractToken(socket);
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return next(new Error('Authentication failed'));
    socket.data.userId = String(decoded.id);
    return next();
  } catch (err) {
    return next(new Error('Authentication failed'));
  }
}

const IDENTITY_KEYS = ['userId', 'from'];

// Per-event guard: a client may only act as the user it authenticated as.
// Blocks spoofing `userId` / `from` / register(userId) for someone else.
function identityGuard(socket) {
  return ([event, ...args], next) => {
    const me = socket.data?.userId;
    if (!me) return next(); // auth disabled via SOCKET_AUTH_REQUIRED=false

    if (event === 'register') {
      const claimed = args[0] == null ? '' : String(args[0]);
      if (claimed && claimed !== me) return next(new Error('Identity mismatch'));
      return next();
    }

    const payload = args[0];
    if (payload && typeof payload === 'object') {
      for (const key of IDENTITY_KEYS) {
        if (payload[key] != null && String(payload[key]) !== me) {
          return next(new Error('Identity mismatch'));
        }
      }
    }
    return next();
  };
}

module.exports = { socketAuth, identityGuard };
