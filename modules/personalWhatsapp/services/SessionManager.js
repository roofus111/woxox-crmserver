const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const PersonalWhatsAppSession = require('../models/PersonalWhatsAppSession');

const AUTH_ROOT =
  process.env.PERSONAL_WA_AUTH_DIR ||
  path.join(process.cwd(), 'data', 'wa-sessions');

/** @type {Map<string, { sock: any, status: string, qrDataUrl: string|null, phone: string, companyId?: any }>} */
const liveSessions = new Map();

let baileysMod = null;
let cachedWaVersion = null;
let cachedWaVersionAt = 0;
const VERSION_TTL_MS = 6 * 60 * 60 * 1000;

async function getBaileys() {
  if (!baileysMod) {
    baileysMod = await import('@whiskeysockets/baileys');
  }
  return baileysMod;
}

async function getWaVersion() {
  const now = Date.now();
  if (cachedWaVersion && now - cachedWaVersionAt < VERSION_TTL_MS) {
    return cachedWaVersion;
  }
  try {
    const { fetchLatestBaileysVersion } = await getBaileys();
    const { version } = await fetchLatestBaileysVersion();
    cachedWaVersion = version;
    cachedWaVersionAt = now;
    return version;
  } catch {
    return cachedWaVersion || undefined;
  }
}

function ensureAuthDir(userId) {
  const dir = path.join(AUTH_ROOT, String(userId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function hasAuthCreds(userId) {
  try {
    return fs.existsSync(path.join(AUTH_ROOT, String(userId), 'creds.json'));
  } catch {
    return false;
  }
}

function emitToUser(userId, event, payload) {
  try {
    // services/ -> personalWhatsapp/ -> modules/ -> crmserver root
    const { getIO } = require('../../../socketServer');
    const io = getIO?.();
    if (io) io.to(String(userId)).emit(event, payload);
  } catch (err) {
    console.warn('personal-wa emit failed:', err.message);
  }
}

async function upsertDb(userId, companyId, patch) {
  return PersonalWhatsAppSession.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        company: companyId,
        ...patch,
      },
      $setOnInsert: { user: userId },
    },
    { upsert: true, new: true }
  );
}

function publicStatus(userId) {
  const live = liveSessions.get(String(userId));
  return {
    status: live?.status || 'disconnected',
    qrDataUrl: live?.qrDataUrl || null,
    phoneNumber: live?.phone || '',
    lastError: live?.lastError || '',
  };
}

function waitForStatus(userId, predicate, timeoutMs = 20000) {
  const uid = String(userId);
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const current = publicStatus(uid);
      if (predicate(current)) {
        resolve(current);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(current);
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

async function endSocket(sock) {
  if (!sock) return;
  try {
    sock.ev?.removeAllListeners?.();
  } catch {
    /* ignore */
  }
  try {
    sock.end?.(undefined);
  } catch {
    /* ignore */
  }
}

async function startSession(userId, companyId, options = {}) {
  const { forceNewQr = false, waitMs = 20000 } = options;
  const uid = String(userId);
  const existing = liveSessions.get(uid);

  if (!forceNewQr && existing?.status === 'connected' && existing.sock) {
    return {
      status: 'connected',
      phoneNumber: existing.phone,
      qrDataUrl: null,
      lastError: '',
    };
  }

  // Already waiting on a QR — return it instead of slow full restart
  if (!forceNewQr && existing?.status === 'qr' && existing.qrDataUrl) {
    return publicStatus(uid);
  }

  if (existing?.sock) {
    await endSocket(existing.sock);
    liveSessions.delete(uid);
  }

  if (forceNewQr) {
    const authDir = path.join(AUTH_ROOT, uid);
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
  } = await getBaileys();

  const authDir = ensureAuthDir(uid);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const version = await getWaVersion();

  liveSessions.set(uid, {
    sock: null,
    status: 'connecting',
    qrDataUrl: null,
    phone: '',
    companyId,
    lastError: '',
  });
  await upsertDb(uid, companyId, { status: 'connecting', lastError: '' });
  emitToUser(uid, 'personal_wa:status', publicStatus(uid));

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 30000,
  });

  liveSessions.set(uid, {
    sock,
    status: 'connecting',
    qrDataUrl: null,
    phone: '',
    companyId,
    lastError: '',
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    const live = liveSessions.get(uid) || {
      sock,
      status: 'connecting',
      qrDataUrl: null,
      phone: '',
      companyId,
      lastError: '',
    };

    if (qr) {
      try {
        live.qrDataUrl = await qrcode.toDataURL(qr, { margin: 1, width: 280 });
        live.status = 'qr';
        live.lastError = '';
        liveSessions.set(uid, live);
        await upsertDb(uid, companyId, { status: 'qr', lastQrAt: new Date(), lastError: '' });
        emitToUser(uid, 'personal_wa:status', publicStatus(uid));
      } catch (err) {
        live.status = 'error';
        live.lastError = err.message || 'QR generation failed';
        liveSessions.set(uid, live);
        await upsertDb(uid, companyId, {
          status: 'error',
          lastError: live.lastError,
        });
        emitToUser(uid, 'personal_wa:status', publicStatus(uid));
      }
    }

    if (connection === 'open') {
      const phone =
        sock.user?.id?.split(':')[0] ||
        sock.user?.id?.replace(/@.*/, '') ||
        '';
      live.status = 'connected';
      live.qrDataUrl = null;
      live.phone = phone;
      live.lastError = '';
      liveSessions.set(uid, live);
      await upsertDb(uid, companyId, {
        status: 'connected',
        phoneNumber: phone,
        pushName: sock.user?.name || '',
        connectedAt: new Date(),
        lastError: '',
      });
      emitToUser(uid, 'personal_wa:status', publicStatus(uid));
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      const statusCode = code || 0;
      // 515 = restart required after pairing — reconnect with saved creds
      const shouldReconnect = !loggedOut && (hasAuthCreds(uid) || statusCode === 515);

      if (loggedOut) {
        live.status = 'logged_out';
        live.qrDataUrl = null;
        live.lastError = 'Logged out from phone. Scan QR again.';
        liveSessions.set(uid, live);
        await upsertDb(uid, companyId, {
          status: 'logged_out',
          lastError: live.lastError,
        });
        emitToUser(uid, 'personal_wa:status', publicStatus(uid));
        try {
          fs.rmSync(authDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
        liveSessions.delete(uid);
        return;
      }

      if (shouldReconnect) {
        live.status = 'connecting';
        live.qrDataUrl = null;
        live.lastError = '';
        liveSessions.set(uid, live);
        await upsertDb(uid, companyId, { status: 'connecting', lastError: '' });
        emitToUser(uid, 'personal_wa:status', publicStatus(uid));
        setTimeout(() => {
          const current = liveSessions.get(uid);
          if (current?.status === 'connected') return;
          startSession(userId, companyId, { forceNewQr: false, waitMs: 0 }).catch((err) => {
            console.error('personal-wa reconnect failed:', err.message);
          });
        }, 800);
        return;
      }

      live.status = 'disconnected';
      live.qrDataUrl = null;
      live.lastError = lastDisconnect?.error?.message || 'Connection closed';
      liveSessions.set(uid, live);
      await upsertDb(uid, companyId, {
        status: 'disconnected',
        lastError: live.lastError,
      });
      emitToUser(uid, 'personal_wa:status', publicStatus(uid));
    }
  });

  if (!waitMs) return publicStatus(uid);

  // Wait until QR is ready or already connected (saved session)
  return waitForStatus(
    uid,
    (s) => s.status === 'qr' || s.status === 'connected' || s.status === 'error' || s.status === 'logged_out',
    waitMs
  );
}

async function getStatus(userId) {
  const uid = String(userId);
  const live = publicStatus(uid);
  if (live.status === 'connected' || live.status === 'qr' || live.status === 'connecting') {
    return live;
  }

  const doc = await PersonalWhatsAppSession.findOne({ user: uid }).lean();
  if (!doc) return { status: 'disconnected', qrDataUrl: null, phoneNumber: '', lastError: '' };

  // Auth still on disk but process lost the socket — try restore in background
  if ((doc.status === 'connected' || hasAuthCreds(uid)) && hasAuthCreds(uid) && !liveSessions.get(uid)) {
    const companyId = doc.company;
    if (companyId) {
      startSession(uid, companyId, { waitMs: 0 }).catch(() => {});
    }
    return {
      status: 'connecting',
      qrDataUrl: null,
      phoneNumber: doc.phoneNumber || '',
      lastError: '',
    };
  }

  return {
    status: doc.status || 'disconnected',
    qrDataUrl: null,
    phoneNumber: doc.phoneNumber || '',
    lastError: doc.lastError || '',
  };
}

async function disconnectSession(userId, companyId) {
  const uid = String(userId);
  const live = liveSessions.get(uid);
  if (live?.sock) {
    try {
      await live.sock.logout?.();
    } catch {
      await endSocket(live.sock);
    }
  }
  liveSessions.delete(uid);
  const authDir = path.join(AUTH_ROOT, uid);
  try {
    fs.rmSync(authDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  await upsertDb(uid, companyId, {
    status: 'disconnected',
    phoneNumber: '',
    pushName: '',
    lastError: '',
  });
  emitToUser(uid, 'personal_wa:status', publicStatus(uid));
  return { status: 'disconnected', qrDataUrl: null, phoneNumber: '', lastError: '' };
}

function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

async function sendText(userId, phone, message) {
  const uid = String(userId);
  let live = liveSessions.get(uid);
  if (!live?.sock || live.status !== 'connected') {
    const doc = await PersonalWhatsAppSession.findOne({ user: uid }).lean();
    if (doc?.company && hasAuthCreds(uid)) {
      await startSession(uid, doc.company, { waitMs: 15000 });
      live = liveSessions.get(uid);
    }
  }
  if (!live?.sock || live.status !== 'connected') {
    const err = new Error('WhatsApp is not connected. Scan the QR code first.');
    err.status = 400;
    throw err;
  }
  const jidPhone = normalizePhone(phone);
  if (!jidPhone) {
    const err = new Error('Invalid phone number');
    err.status = 400;
    throw err;
  }
  const jid = `${jidPhone}@s.whatsapp.net`;
  const result = await live.sock.sendMessage(jid, { text: String(message || '') });
  return {
    success: true,
    messageId: result?.key?.id || null,
    to: jidPhone,
  };
}

module.exports = {
  startSession,
  getStatus,
  disconnectSession,
  sendText,
  publicStatus,
  AUTH_ROOT,
};
