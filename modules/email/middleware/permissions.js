const EMAIL_PERMISSIONS = {
  admin: ['view', 'create', 'edit', 'delete', 'approve', 'publish', 'analytics', 'smtp', 'settings'],
  manager: ['view', 'create', 'edit', 'delete', 'approve', 'publish', 'analytics', 'smtp'],
  marketing: ['view', 'create', 'edit', 'delete', 'approve', 'publish', 'analytics'],
  user: ['view', 'create', 'edit'],
  counselor: ['view', 'create', 'edit'],
  viewer: ['view', 'analytics'],
  finance: ['view'],
  pipeline: ['view', 'create'],
  hr: ['view'],
  guest: ['view'],
};

function requireEmailPermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role || 'guest';
    const allowed = EMAIL_PERMISSIONS[role] || EMAIL_PERMISSIONS.guest;
    if (role === 'admin' || allowed.includes(permission)) return next();
    return res.status(403).json({ success: false, message: `Permission denied: ${permission}` });
  };
}

module.exports = { requireEmailPermission, EMAIL_PERMISSIONS };
