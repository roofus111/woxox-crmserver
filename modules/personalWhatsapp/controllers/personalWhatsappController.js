const SessionManager = require('../services/SessionManager');

function getCompanyId(user) {
  if (!user?.company) return null;
  return typeof user.company === 'object' && user.company._id
    ? user.company._id
    : user.company;
}

exports.getStatus = async (req, res) => {
  try {
    const status = await SessionManager.getStatus(req.user._id);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.connect = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Your account is not linked to a company yet.',
      });
    }
    const forceNewQr = Boolean(req.body?.refresh || req.query?.refresh);
    const status = await SessionManager.startSession(req.user._id, companyId, {
      forceNewQr,
      waitMs: 20000,
    });
    res.json({ success: true, ...status });
  } catch (err) {
    console.error('personal-whatsapp connect error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.disconnect = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    const status = await SessionManager.disconnectSession(req.user._id, companyId);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { phone, message, leadId } = req.body || {};
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'phone and message are required',
      });
    }
    const result = await SessionManager.sendText(req.user._id, phone, message);
    res.json({ success: true, ...result, leadId: leadId || null });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};
