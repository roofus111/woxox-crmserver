const WHATSAPP_PERMISSIONS = {
  admin: ['view_chats', 'reply', 'delete', 'broadcast', 'templates', 'campaigns', 'settings', 'reports', 'assignments'],
  manager: ['view_chats', 'reply', 'delete', 'broadcast', 'templates', 'campaigns', 'reports', 'assignments'],
  user: ['view_chats', 'reply', 'assignments'],
  guest: ['view_chats'],
  hr: ['view_chats'],
  finance: ['view_chats', 'reports'],
  pipeline: ['view_chats', 'reply'],
  docteam: ['view_chats', 'reply'],
  telecaller: ['view_chats', 'reply'],
  marketing: ['view_chats', 'reply', 'broadcast', 'templates', 'campaigns', 'reports'],
  viewer: ['view_chats', 'reports'],
};

/**
 * Middleware factory for WhatsApp permission checks.
 * @param {string} permission
 * @returns {Function}
 */
function requireWhatsAppPermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role || 'guest';
    const allowed = WHATSAPP_PERMISSIONS[role] || WHATSAPP_PERMISSIONS.guest;

    if (role === 'admin' || allowed.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Permission denied: ${permission}`,
    });
  };
}

module.exports = { requireWhatsAppPermission, WHATSAPP_PERMISSIONS };
