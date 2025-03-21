const BankAccount = require('../models/Account');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const Employee = require('../models/HR');

class InsightsController {
  // Get overall account insights
  static async getAccountInsights(req, res) {
    try {
      const { accountId } = req.params;
      const account = await BankAccount.findById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Calculate basic metrics
      const totalTransactions = account.transactions.length;
      const totalIncome = account.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = account.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate category-wise breakdown
      const categoryBreakdown = account.transactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = {
            total: 0,
            count: 0,
            type: transaction.type
          };
        }
        acc[transaction.category].total += transaction.amount;
        acc[transaction.category].count += 1;
        return acc;
      }, {});

      // Get monthly trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyTrends = account.transactions
        .filter(t => t.date >= sixMonthsAgo)
        .reduce((acc, transaction) => {
          const monthYear = `${transaction.date.getMonth() + 1}/${transaction.date.getFullYear()}`;
          if (!acc[monthYear]) {
            acc[monthYear] = { income: 0, expenses: 0 };
          }
          if (transaction.type === 'income') {
            acc[monthYear].income += transaction.amount;
          } else {
            acc[monthYear].expenses += transaction.amount;
          }
          return acc;
        }, {});

      res.json({
        accountSummary: {
          currentBalance: account.balance,
          totalTransactions,
          totalIncome,
          totalExpenses,
          netCashflow: totalIncome - totalExpenses
        },
        categoryBreakdown,
        monthlyTrends,
        metrics: {
          averageTransactionSize: (totalIncome + totalExpenses) / totalTransactions,
          incomeToExpenseRatio: totalIncome / totalExpenses,
          mostUsedPaymentMethod: getMostFrequent(account.transactions, 'paymentMethod'),
          topCategory: getMostFrequent(account.transactions, 'category')
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error fetching insights', error: error.message });
    }
  }

  // Get cash flow analysis
  static async getCashFlowAnalysis(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate } = req.query;

      const account = await BankAccount.findById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const filteredTransactions = account.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return (!startDate || transactionDate >= new Date(startDate)) &&
               (!endDate || transactionDate <= new Date(endDate));
      });

      const cashFlowAnalysis = {
        totalInflow: filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        totalOutflow: filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        dailyCashFlow: getDailyCashFlow(filteredTransactions)
      };

      res.json(cashFlowAnalysis);

    } catch (error) {
      res.status(500).json({ message: 'Error analyzing cash flow', error: error.message });
    }
  }

  // Get individual transaction insights
  static async getTransactionInsights(req, res) {
    try {
      const { accountId, transactionId } = req.params;
      const account = await BankAccount.findById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const transaction = account.transactions.find(t => t._id.toString() === transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Get category average for comparison
      const categoryTransactions = account.transactions.filter(t => 
        t.category === transaction.category && t._id.toString() !== transactionId
      );
      
      const categoryAverage = categoryTransactions.length > 0
        ? categoryTransactions.reduce((sum, t) => sum + t.amount, 0) / categoryTransactions.length
        : 0;

      // Get monthly average for this category
      const monthYear = `${transaction.date.getMonth() + 1}/${transaction.date.getFullYear()}`;
      const monthlyTransactions = account.transactions.filter(t => 
        t.category === transaction.category &&
        `${t.date.getMonth() + 1}/${t.date.getFullYear()}` === monthYear &&
        t._id.toString() !== transactionId
      );

      const monthlyAverage = monthlyTransactions.length > 0
        ? monthlyTransactions.reduce((sum, t) => sum + t.amount, 0) / monthlyTransactions.length
        : 0;

      res.json({
        transaction,
        insights: {
          categoryComparison: {
            categoryAverage,
            percentDifference: ((transaction.amount - categoryAverage) / categoryAverage) * 100
          },
          monthlyComparison: {
            monthlyAverage,
            percentDifference: ((transaction.amount - monthlyAverage) / monthlyAverage) * 100
          },
          frequency: getCategoryFrequency(account.transactions, transaction.category),
          isRecurring: isRecurringTransaction(account.transactions, transaction)
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error fetching transaction insights', error: error.message });
    }
  }

  // Get overall insights across all accounts
  static async getOverallInsights(req, res) {
    try {
      console.log(req.user);
      // Get all accounts (optionally filter by user if authentication is implemented)
      const accounts = await BankAccount.find({ company: req.user.company._id });
      console.log(req.user);
      
      if (!accounts || accounts.length === 0) {
        return res.status(404).json({ message: 'No accounts found' });
      }

      // Aggregate all transactions across accounts
      const allTransactions = accounts.flatMap(account => account.transactions);
      
      // Calculate overall metrics
      const totalAccounts = accounts.length;
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const totalTransactions = allTransactions.length;
      
      const totalIncome = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalExpenses = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate category-wise breakdown across all accounts
      const categoryBreakdown = allTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = {
            total: 0,
            count: 0,
            type: transaction.type
          };
        }
        acc[transaction.category].total += transaction.amount;
        acc[transaction.category].count += 1;
        return acc;
      }, {});

      // Get monthly trends (last 6 months) across all accounts
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyTrends = allTransactions
        .filter(t => t.date >= sixMonthsAgo)
        .reduce((acc, transaction) => {
          const monthYear = `${transaction.date.getMonth() + 1}/${transaction.date.getFullYear()}`;
          if (!acc[monthYear]) {
            acc[monthYear] = { income: 0, expenses: 0 };
          }
          if (transaction.type === 'income') {
            acc[monthYear].income += transaction.amount;
          } else {
            acc[monthYear].expenses += transaction.amount;
          }
          return acc;
        }, {});

      // Account with highest balance
      const accountWithHighestBalance = accounts.reduce(
        (highest, account) => account.balance > highest.balance ? account : highest,
        { balance: -Infinity }
      );

      // Account with most transactions
      const accountWithMostTransactions = accounts.reduce(
        (most, account) => account.transactions.length > most.count ? 
          { id: account._id, count: account.transactions.length } : most,
        { count: -Infinity }
      );

      res.json({
        overallSummary: {
          totalAccounts,
          totalBalance,
          totalTransactions,
          totalIncome,
          totalExpenses,
          netCashflow: totalIncome - totalExpenses
        },
        accountMetrics: {
          averageAccountBalance: totalBalance / totalAccounts,
          accountWithHighestBalance: {
            id: accountWithHighestBalance._id,
            balance: accountWithHighestBalance.balance
          },
          accountWithMostTransactions: accountWithMostTransactions.id !== -Infinity ? 
            accountWithMostTransactions : null
        },
        categoryBreakdown,
        monthlyTrends,
        overallMetrics: {
          averageTransactionSize: totalTransactions > 0 ? 
            (totalIncome + totalExpenses) / totalTransactions : 0,
          incomeToExpenseRatio: totalExpenses > 0 ? 
            totalIncome / totalExpenses : Infinity,
          mostUsedPaymentMethod: getMostFrequent(allTransactions, 'paymentMethod'),
          topCategory: getMostFrequent(allTransactions, 'category')
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error fetching overall insights', error: error.message });
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  // Get overall lead insights
  static async getLeadInsights(req, res) {
    try {
      // Filter leads by company
      const filter = { company: req.user.company._id };
      
      // Get all leads for the company
      const leads = await Lead.find(filter)
        .populate('assignedTo', 'name email')
        .populate('campaignid', 'name');
      
      if (!leads || leads.length === 0) {
        return res.status(404).json({ message: 'No leads found' });
      }

      // Calculate overall metrics
      const totalLeads = leads.length;
      
      // Status breakdown
      const statusBreakdown = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});
      
      // Source breakdown
      const sourceBreakdown = leads.reduce((acc, lead) => {
        if (lead.source) {
          acc[lead.source] = (acc[lead.source] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Campaign breakdown
      const campaignBreakdown = leads.reduce((acc, lead) => {
        if (lead.campaign) {
          acc[lead.campaign] = (acc[lead.campaign] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Assigned to breakdown
      const assignedToBreakdown = leads.reduce((acc, lead) => {
        if (lead.assignedTo) {
          const assigneeName = lead.assignedTo.name || 'Unknown';
          acc[assigneeName] = (acc[assigneeName] || 0) + 1;
        } else {
          acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Monthly trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyTrends = leads
        .filter(lead => lead.createdAt >= sixMonthsAgo)
        .reduce((acc, lead) => {
          const monthYear = `${lead.createdAt.getMonth() + 1}/${lead.createdAt.getFullYear()}`;
          if (!acc[monthYear]) {
            acc[monthYear] = { count: 0 };
          }
          acc[monthYear].count += 1;
          return acc;
        }, {});
      
      // Conversion rate
      const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
      const conversionRate = (convertedLeads / totalLeads) * 100;
      
      // Untouched leads
      const untouchedLeads = leads.filter(lead => lead.untouched).length;
      
      res.json({
        overallSummary: {
          totalLeads,
          convertedLeads,
          conversionRate,
          untouchedLeads,
          untouchedPercentage: (untouchedLeads / totalLeads) * 100
        },
        statusBreakdown,
        sourceBreakdown,
        campaignBreakdown,
        assignedToBreakdown,
        monthlyTrends,
        metrics: {
          averageNotesPerLead: leads.reduce((sum, lead) => sum + (lead.notes ? lead.notes.length : 0), 0) / totalLeads,
          mostCommonStatus: getMostFrequentFromObject(statusBreakdown),
          mostCommonSource: getMostFrequentFromObject(sourceBreakdown),
          mostActiveAssignee: getMostFrequentFromObject(assignedToBreakdown)
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error fetching lead insights', error: error.message });
    }
  }

  // Get campaign insights
  static async getCampaignInsights(req, res) {
    try {
      // Filter campaigns by company
      const filter = { company: req.user.company._id };
      
      // Get all campaigns for the company
      const campaigns = await Campaign.find(filter)
        .populate('User', 'name email')
        .populate('Pipeline', 'name');
      
      if (!campaigns || campaigns.length === 0) {
        return res.status(404).json({ message: 'No campaigns found' });
      }

      // Get all leads to analyze campaign performance
      const leads = await Lead.find({ company: req.user.company._id });
      
      // Calculate overall metrics
      const totalCampaigns = campaigns.length;
      
      // Campaign performance metrics
      const campaignPerformance = campaigns.map(campaign => {
        const campaignLeads = leads.filter(lead => 
          lead.campaignid && lead.campaignid.toString() === campaign._id.toString()
        );
        
        const totalLeads = campaignLeads.length;
        const convertedLeads = campaignLeads.filter(lead => lead.status === 'Converted').length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        
        return {
          id: campaign._id,
          name: campaign.name,
          totalLeads,
          convertedLeads,
          conversionRate,
          owner: campaign.User ? campaign.User.name : 'Unassigned',
          createdAt: campaign.createdAt
        };
      });
      
      // Monthly campaign creation trends
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyTrends = campaigns
        .filter(campaign => campaign.createdAt >= sixMonthsAgo)
        .reduce((acc, campaign) => {
          const monthYear = `${campaign.createdAt.getMonth() + 1}/${campaign.createdAt.getFullYear()}`;
          if (!acc[monthYear]) {
            acc[monthYear] = { count: 0 };
          }
          acc[monthYear].count += 1;
          return acc;
        }, {});
      
      // User breakdown (campaign owners)
      const userBreakdown = campaigns.reduce((acc, campaign) => {
        if (campaign.User) {
          const userName = campaign.User.name || 'Unknown';
          acc[userName] = (acc[userName] || 0) + 1;
        } else {
          acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Pipeline breakdown
      const pipelineBreakdown = campaigns.reduce((acc, campaign) => {
        if (campaign.Pipeline) {
          const pipelineName = campaign.Pipeline.name || 'Unknown';
          acc[pipelineName] = (acc[pipelineName] || 0) + 1;
        } else {
          acc['No Pipeline'] = (acc['No Pipeline'] || 0) + 1;
        }
        return acc;
      }, {});
      
      res.json({
        overallSummary: {
          totalCampaigns,
          activeCampaigns: campaigns.filter(c => !c.endDate || c.endDate > new Date()).length,
          totalLeadsGenerated: leads.filter(lead => lead.campaignid).length,
          averageLeadsPerCampaign: campaignPerformance.reduce((sum, c) => sum + c.totalLeads, 0) / totalCampaigns
        },
        campaignPerformance: campaignPerformance.sort((a, b) => b.conversionRate - a.conversionRate),
        topPerformingCampaigns: campaignPerformance
          .sort((a, b) => b.conversionRate - a.conversionRate)
          .slice(0, 5),
        userBreakdown,
        pipelineBreakdown,
        monthlyTrends,
        metrics: {
          averageConversionRate: campaignPerformance.reduce((sum, c) => sum + c.conversionRate, 0) / totalCampaigns,
          mostActiveCampaignOwner: getMostFrequentFromObject(userBreakdown),
          mostUsedPipeline: getMostFrequentFromObject(pipelineBreakdown)
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error fetching campaign insights', error: error.message });
    }
  }

  // Get HR insights
  static async getHRInsights(req, res) {
    try {
      // Filter employees by company
      const filter = { company: req.user.company._id };
      
      // Get all employees for the company
      const employees = await Employee.find(filter)
        .populate('supervisor', 'firstName lastName')
        .populate('User', 'name email');
      
      if (!employees || employees.length === 0) {
        return res.status(404).json({ message: 'No employees found' });
      }

      // Calculate overall metrics
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
      const inactiveEmployees = employees.filter(emp => emp.status === 'Inactive').length;
      
      // Department breakdown
      const departmentBreakdown = employees.reduce((acc, emp) => {
        if (emp.department) {
          acc[emp.department] = (acc[emp.department] || 0) + 1;
        } else {
          acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Job title breakdown
      const jobTitleBreakdown = employees.reduce((acc, emp) => {
        if (emp.jobTitle) {
          acc[emp.jobTitle] = (acc[emp.jobTitle] || 0) + 1;
        } else {
          acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Role breakdown
      const roleBreakdown = employees.reduce((acc, emp) => {
        if (emp.role) {
          acc[emp.role] = (acc[emp.role] || 0) + 1;
        } else {
          acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Gender diversity
      const genderBreakdown = employees.reduce((acc, emp) => {
        if (emp.gender) {
          acc[emp.gender] = (acc[emp.gender] || 0) + 1;
        } else {
          acc['Unspecified'] = (acc['Unspecified'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Tenure analysis
      const currentDate = new Date();
      const tenureData = employees
        .filter(emp => emp.startDate)
        .map(emp => {
          const startDate = new Date(emp.startDate);
          const endDate = emp.endDate ? new Date(emp.endDate) : currentDate;
          const tenureMonths = Math.floor((endDate - startDate) / (30 * 24 * 60 * 60 * 1000));
          return {
            employeeId: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            tenureMonths,
            isActive: emp.status === 'Active'
          };
        });
      
      // Average tenure
      const averageTenure = tenureData.length > 0 
        ? tenureData.reduce((sum, emp) => sum + emp.tenureMonths, 0) / tenureData.length 
        : 0;
      
      // Monthly hiring trends (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const hiringTrends = employees
        .filter(emp => emp.startDate && new Date(emp.startDate) >= twelveMonthsAgo)
        .reduce((acc, emp) => {
          const startDate = new Date(emp.startDate);
          const monthYear = `${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
          if (!acc[monthYear]) {
            acc[monthYear] = { count: 0 };
          }
          acc[monthYear].count += 1;
          return acc;
        }, {});
      
      // Salary statistics (if available)
      let salaryStats = null;
      const employeesWithSalary = employees.filter(emp => emp.salary);
      
      if (employeesWithSalary.length > 0) {
        const salaries = employeesWithSalary.map(emp => emp.salary);
        salaryStats = {
          averageSalary: salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length,
          minSalary: Math.min(...salaries),
          maxSalary: Math.max(...salaries),
          medianSalary: calculateMedian(salaries)
        };
      }
      
      // Recent activities (from history)
      const recentActivities = employees
        .flatMap(emp => emp.history || [])
        .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
        .slice(0, 10)
        .map(activity => ({
          activityType: activity.activityType,
          description: activity.description,
          changedAt: activity.changedAt,
          changedBy: activity.changedBy
        }));
      
      res.json({
        overallSummary: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          activePercentage: (activeEmployees / totalEmployees) * 100
        },
        departmentBreakdown,
        jobTitleBreakdown,
        roleBreakdown,
        genderBreakdown,
        tenureAnalysis: {
          averageTenure,
          longestTenure: tenureData.length > 0 ? Math.max(...tenureData.map(t => t.tenureMonths)) : 0,
          shortestTenure: tenureData.length > 0 ? Math.min(...tenureData.map(t => t.tenureMonths)) : 0,
          tenureDistribution: calculateTenureDistribution(tenureData)
        },
        hiringTrends,
        salaryStats,
        recentActivities,
        metrics: {
          largestDepartment: getMostFrequentFromObject(departmentBreakdown),
          mostCommonJobTitle: getMostFrequentFromObject(jobTitleBreakdown),
          mostCommonRole: getMostFrequentFromObject(roleBreakdown)
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error fetching HR insights', error: error.message });
    }
  }
}

// Helper function to get most frequent value in transactions
function getMostFrequent(transactions, field) {
  const frequency = transactions.reduce((acc, t) => {
    acc[t[field]] = (acc[t[field]] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)[0][0];
}

// Helper function to get daily cash flow
function getDailyCashFlow(transactions) {
  return transactions.reduce((acc, t) => {
    const date = t.date.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { inflow: 0, outflow: 0 };
    }
    if (t.type === 'income') {
      acc[date].inflow += t.amount;
    } else {
      acc[date].outflow += t.amount;
    }
    return acc;
  }, {});
}

// Helper function to check transaction frequency
function getCategoryFrequency(transactions, category) {
  const categoryTransactions = transactions.filter(t => t.category === category);
  return {
    daily: categoryTransactions.length / 30, // Average per day
    monthly: categoryTransactions.length / 12, // Average per month
    total: categoryTransactions.length
  };
}

// Helper function to detect recurring transactions
function isRecurringTransaction(transactions, currentTransaction) {
  const similarTransactions = transactions.filter(t =>
    t.category === currentTransaction.category &&
    Math.abs(t.amount - currentTransaction.amount) < 1 && // Same amount (within $1 difference)
    t._id.toString() !== currentTransaction._id
  );

  // Check if there are at least 2 similar transactions in different months
  const uniqueMonths = new Set(similarTransactions.map(t => 
    `${t.date.getMonth()}-${t.date.getFullYear()}`
  ));

  return uniqueMonths.size >= 2;
}

// Helper function to get most frequent value from an object
function getMostFrequentFromObject(obj) {
  return Object.entries(obj)
    .sort(([,a], [,b]) => b - a)[0][0];
}

// Helper function to calculate median
function calculateMedian(values) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

// Helper function to calculate tenure distribution
function calculateTenureDistribution(tenureData) {
  return {
    'Less than 1 year': tenureData.filter(t => t.tenureMonths < 12).length,
    '1-2 years': tenureData.filter(t => t.tenureMonths >= 12 && t.tenureMonths < 24).length,
    '2-5 years': tenureData.filter(t => t.tenureMonths >= 24 && t.tenureMonths < 60).length,
    '5+ years': tenureData.filter(t => t.tenureMonths >= 60).length
  };
}

module.exports = InsightsController;
