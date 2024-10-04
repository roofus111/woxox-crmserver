const authorizeCompanyAccess = (req, res, next) => {
    const userCompanyId = req.user.company._id.toString();
    
    if (req.body.company && req.body.company !== userCompanyId) {
      return res.status(403).json({ message: 'Forbidden: Access to this company is not allowed' });
    }
  
    next();
  };
  
  module.exports = authorizeCompanyAccess;
  