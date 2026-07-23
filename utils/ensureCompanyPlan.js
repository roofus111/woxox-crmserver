const { CompanyPurchase } = require('../models/Plan');
const Company = require('../models/Company');

const DEFAULT_TRIAL_MODULES = [
  {
    moduleName: 'CRM',
    plans: [
      {
        planName: 'Trial',
        price: 0,
        durationMonths: 12,
        features: [],
        employeeLimit: 10,
        leadLimit: 2000,
        campaignLimit: 5,
      },
    ],
  },
];

async function ensureCompanyPlan(companyId) {
  let plan = await CompanyPurchase.findOne({ companyId });
  if (plan) return plan;

  const validTill = new Date();
  validTill.setFullYear(validTill.getFullYear() + 1);

  plan = await CompanyPurchase.create({
    companyId,
    planType: 'free trial',
    status: 'active',
    validTill,
    modules: DEFAULT_TRIAL_MODULES,
  });

  await Company.findByIdAndUpdate(companyId, { purchaseModuleId: plan._id });
  return plan;
}

function getEmployeeLimit(plan) {
  const limit = plan?.modules?.[0]?.plans?.[0]?.employeeLimit;
  return typeof limit === 'number' && limit > 0 ? limit : 10;
}

module.exports = { ensureCompanyPlan, getEmployeeLimit };
