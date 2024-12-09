const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeCompanyAccess = require('../middleware/authorizeCompanyAccess');

router.use(authenticateUser); // Apply authentication to all routes
router.get('/', companyController.getCompanyById);
router.get('/getall', companyController.getAllCompanies);
router.post('/', companyController.createCompany);
router.put('/', authorizeCompanyAccess, companyController.updateCompany);
router.put('/modules/:id',companyController.updateModule);

module.exports = router;
