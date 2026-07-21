/**
 * Ensure the authenticated user's company matches any company id in body/params/query.
 */
const authorizeCompanyAccess = (req, res, next) => {
  try {
    const userCompany = req.user?.company
    const userCompanyId =
      userCompany && typeof userCompany === 'object' ? userCompany._id?.toString() : userCompany?.toString()

    if (!userCompanyId) {
      return res.status(403).json({ message: 'Forbidden: no company on user' })
    }

    const candidates = [
      req.body?.company,
      req.params?.companyId,
      req.query?.companyId,
      req.query?.company
    ].filter(Boolean)

    for (const c of candidates) {
      const id = typeof c === 'object' ? c._id?.toString() || c.toString() : String(c)
      if (id && id !== userCompanyId) {
        return res.status(403).json({ message: 'Forbidden: Access to this company is not allowed' })
      }
    }

    next()
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' })
  }
}

module.exports = authorizeCompanyAccess
