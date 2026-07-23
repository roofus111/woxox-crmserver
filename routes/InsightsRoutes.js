const express = require('express');
const router = express.Router();
const InsightsController = require('../controllers/InsightsController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)
router.get('/accounts/overall-insights', InsightsController.getOverallInsights);
router.get('/leads/insights', InsightsController.getLeadInsights);
router.get('/campaigns/insights', InsightsController.getCampaignInsights);
router.get('/hr/insights', InsightsController.getHRInsights);
router.get('/dashboard/summary', InsightsController.getOperatingDashboard);

//unused routes
router.get('/accounts/:accountId/insights', InsightsController.getAccountInsights);
router.get('/accounts/:accountId/cash-flow', InsightsController.getCashFlowAnalysis);
// router.get('/accounts/:accountId/category-frequency', InsightsController.getCategoryFrequency);
// router.get('/accounts/:accountId/recurring-transactions', InsightsController.getRecurringTransactions);

module.exports = router;