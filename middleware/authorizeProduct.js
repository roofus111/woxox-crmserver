/**
 * Role gate — allow only listed roles (admin always allowed).
 * Usage: authorizeRoles('admin', 'pipeline')
 */
const authorizeRoles = (...roles) => (req, res, next) => {
  const role = req.user?.role
  if (!role) {
    return res.status(403).json({ message: 'Forbidden: role required' })
  }
  if (role === 'admin' || roles.includes(role)) {
    return next()
  }
  return res.status(403).json({ message: 'Forbidden: insufficient role' })
}

/**
 * Product entitlement gate for Project Manager Lite / Max.
 * Checks company.enabledProducts, then plan moduleAccess addon IDs.
 *
 * Usage: authorizeProduct('projectsLite') or authorizeProduct('projectsMax')
 * Max access also satisfies Lite routes (Max is a superset).
 */
const ADDON_BY_PRODUCT = {
  crm: [],
  projectsLite: ['PRJLITE0825', 'PRJ0825', 'WFM0825', 'PLM0825'],
  projectsMax: ['PRJ0825', 'PLM0825', 'WFM0825']
}

function companyHasProduct(company, productId) {
  const list = company?.enabledProducts || company?.enabledModules
  if (!Array.isArray(list) || !list.length) return null // unknown → defer
  if (list.includes(productId)) return true
  // Max unlocks Lite
  if (productId === 'projectsLite' && list.includes('projectsMax')) return true
  return false
}

function planHasAddon(user, productId) {
  const access = user?.plan?.modules?.[0]?.plans?.[0]?.moduleAccess
  if (!Array.isArray(access)) return null
  const addons = ADDON_BY_PRODUCT[productId] || []
  const hit = access.some(m => m?.isActive && addons.includes(m.addonId))
  if (hit) return true
  if (productId === 'projectsLite') {
    const maxAddons = ADDON_BY_PRODUCT.projectsMax
    return access.some(m => m?.isActive && maxAddons.includes(m.addonId)) ? true : false
  }
  return false
}

const authorizeProduct = (...productIds) => (req, res, next) => {
  try {
    const role = req.user?.role
    if (role === 'admin') return next()

    // CRM core is always available for authenticated company users
    if (productIds.includes('crm') && req.user?.company) {
      return next()
    }

    const company = req.user?.company
    const companyObj = company && typeof company === 'object' ? company : null

    for (const productId of productIds) {
      if (productId === 'crm') continue

      const fromCompany = companyHasProduct(companyObj, productId)
      if (fromCompany === true) return next()

      const fromPlan = planHasAddon(req.user, productId)
      if (fromPlan === true) return next()

      // Demo / bootstrap: if neither company nor plan declares products, allow authenticated company users
      if (fromCompany === null && fromPlan === null && company) {
        return next()
      }
    }

    return res.status(403).json({
      message: 'Forbidden: product not enabled for this tenant',
      requiredProducts: productIds
    })
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden: product check failed' })
  }
}

module.exports = {
  authorizeRoles,
  authorizeProduct
}
