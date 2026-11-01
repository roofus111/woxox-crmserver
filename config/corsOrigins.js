// Browser origins allowed to call the API / chat socket.
// Override with CORS_ORIGIN="https://a.example.com,https://b.example.com".
const DEFAULT_ORIGINS = [
  'https://app.woxox.com',
  'https://connect.woxox.com',
  'https://www.woxox.com',
  'https://woxox.com',
];

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

function allowedOrigins(env = process.env) {
  const configured = String(env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const list = configured.length ? configured : DEFAULT_ORIGINS.slice();
  if (String(env.NODE_ENV || '').toLowerCase() !== 'production') {
    list.push(...DEV_ORIGINS);
  }
  return list;
}

// Works for both `cors` and socket.io (`origin: fn`).
// Requests with no Origin header (mobile apps, server-to-server webhooks, curl)
// are not browser cross-origin requests, so they pass through.
function originCheck(env = process.env) {
  const list = allowedOrigins(env);
  return (origin, callback) => {
    if (!origin || list.includes(origin)) return callback(null, true);
    return callback(null, false);
  };
}

module.exports = { allowedOrigins, originCheck };
