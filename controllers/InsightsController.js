const BankAccount = require('../models/Account');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const Employee = require('../models/HR');
const mongoose = require('mongoose');
const cache = require('memory-cache');
const Redis = require('ioredis'); // For distributed caching
const { Worker } = require('worker_threads'); // For CPU-intensive tasks
const path = require('path');
const CHUNK_SIZE = 10000;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const redisCloud = require('../config/redis');

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

class InsightsController {
  // Update worker pool configuration to limit CPU usage to 50%
  static workerPool = new Map();
  static maxWorkers = Math.max(1, Math.floor(require('os').cpus().length * 0.5));
  static workerTasks = new Map();
  static cpuThrottleInterval = 100; // ms between CPU-intensive operations

  // Enhanced worker management with CPU throttling
  static async getWorker(taskId) {
    // Add CPU throttling
    await new Promise(resolve => setTimeout(resolve, this.cpuThrottleInterval));

    // Reuse existing worker if available and not busy
    for (const [workerId, worker] of this.workerPool.entries()) {
      if (!this.workerTasks.has(workerId)) {
        this.workerTasks.set(workerId, taskId);
        return worker;
      }
    }

    // Create new worker if pool not full
    if (this.workerPool.size < this.maxWorkers) {
      const workerId = this.workerPool.size;
      const worker = new Worker(path.join(__dirname, '../workers/insightsWorker.js'));
      
      // Handle worker errors and cleanup
      worker.on('error', (error) => {
        console.error(`Worker ${workerId} error:`, error);
        this.cleanupWorker(workerId);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${workerId} exited with code ${code}`);
        }
        this.cleanupWorker(workerId);
      });

      this.workerPool.set(workerId, worker);
      this.workerTasks.set(workerId, taskId);
      return worker;
    }

    // Wait for next available worker
    return new Promise((resolve) => {
      const checkWorker = setInterval(() => {
        for (const [workerId, worker] of this.workerPool.entries()) {
          if (!this.workerTasks.has(workerId)) {
            clearInterval(checkWorker);
            this.workerTasks.set(workerId, taskId);
            resolve(worker);
            break;
          }
        }
      }, 100);
    });
  }

  // Cleanup worker
  static cleanupWorker(workerId) {
    this.workerPool.delete(workerId);
    this.workerTasks.delete(workerId);
  }

  // Enhanced chunk processing with CPU throttling
  static async processInChunks(data, processFn, useWorker = false) {
    const results = [];
    const chunks = [];
    const taskId = Date.now().toString();

    // Adjust chunk size to account for CPU throttling
    const chunkSize = Math.max(
      CHUNK_SIZE, 
      Math.ceil(data.length / (this.maxWorkers * 4)) // Smaller chunks for better throttling
    );
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    if (useWorker && chunks.length > 1) {
      // Process chunks in parallel with throttling
      const workerPromises = chunks.map(async (chunk, index) => {
        // Add delay between spawning workers
        await new Promise(resolve => 
          setTimeout(resolve, index * this.cpuThrottleInterval)
        );
        
        const worker = await this.getWorker(`${taskId}-${index}`);
        
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Worker timeout'));
          }, 30000);

          worker.once('message', (result) => {
            clearTimeout(timeoutId);
            this.workerTasks.delete([...this.workerPool.entries()]
              .find(([, w]) => w === worker)?.[0]);
            resolve(result);
          });

          worker.once('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
          });

          worker.postMessage({
            chunk,
            operation: processFn.name,
            params: processFn.toString(),
            cpuThrottle: this.cpuThrottleInterval
          });
        });
      });

      try {
        const chunkResults = await Promise.all(workerPromises);
        results.push(...chunkResults.flat());
      } catch (error) {
        console.error('Worker processing error:', error);
        // Fallback to sequential processing
        for (const chunk of chunks) {
          results.push(...await processFn(chunk));
        }
      }
    } else {
      // Process chunks sequentially
      for (const chunk of chunks) {
        results.push(...await processFn(chunk));
        // Yield to event loop periodically
        if (chunks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    return results;
  }

  // Enhanced caching with Redis
  static async getCachedData(key, fetchData) {
    try {
      // Try Redis cache first
      const cachedData = await redisCloud.get(key);
      if (cachedData) {
        return cachedData;
      }

      // Fetch and cache data
      const data = await fetchData();
      await redisCloud.set(key, data, CACHE_DURATION);
      return data;
    } catch (error) {
      console.error('Cache error:', error);
      return await fetchData();
    }
  }

  // Get overall account insights
  static async getAccountInsights(req, res) {
    try {
      const { accountId } = req.params;
      const cacheKey = `insights:account:${accountId}`;

      // Try to get from cache
      const cachedData = await redisCloud.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(accountId) } },
        {
          $lookup: {
            from: 'transactions',
            localField: '_id',
            foreignField: 'accountId',
            as: 'transactions'
          }
        },
        // ... rest of your aggregation pipeline
      ];

      const [result] = await BankAccount.aggregate(pipeline).allowDiskUse(true);

      // Cache the results
      await redisCloud.set(cacheKey, result, 300); // Cache for 5 minutes
      res.json(result);

    } catch (error) {
      console.error('Error fetching insights:', error);
      res.status(500).json({ message: 'Error fetching insights', error: error.message });
    }
  }

  // Helper method to format account insights
  static formatAccountInsights(result) {
    // Implementation of formatting logic
    // Moved to separate method for better organization
  }

  // Get cash flow analysis with chunking and caching
  static async getCashFlowAnalysis(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate } = req.query;
      const cacheKey = `cashflow-${accountId}-${startDate}-${endDate}`;

      const analysis = await this.getCachedData(cacheKey, async () => {
        const pipeline = [
          { $match: { _id: new mongoose.Types.ObjectId(accountId) } },
          { $unwind: '$transactions' },
          {
            $match: {
              'transactions.date': {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$transactions.date' } }
              },
              inflow: {
                $sum: {
                  $cond: [{ $eq: ['$transactions.type', 'income'] }, '$transactions.amount', 0]
                }
              },
              outflow: {
                $sum: {
                  $cond: [{ $eq: ['$transactions.type', 'expense'] }, '$transactions.amount', 0]
                }
              }
            }
          }
        ];

        const results = await BankAccount.aggregate(pipeline).allowDiskUse(true);
        return this.formatCashFlowResults(results);
      });

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: 'Error analyzing cash flow', error: error.message });
    }
  }

  // Helper method to format cash flow results
  static formatCashFlowResults(results) {
    // Implementation of formatting logic
    // Moved to separate method for better organization
  }

  // Get transaction insights with chunking and caching
  static async getTransactionInsights(req, res) {
    try {
      const { accountId, transactionId } = req.params;
      
      // Generate cache key
      const cacheKey = `transaction-insights-${accountId}-${transactionId}`;
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        return res.json(cachedData);
      }

      const account = await BankAccount.findById(accountId).lean();
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const transaction = account.transactions.find(t => t._id.toString() === transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Process category transactions in chunks
      const categoryTransactions = account.transactions.filter(t => 
        t.category === transaction.category && t._id.toString() !== transactionId
      );

      let categoryTotal = 0;
      let categoryCount = 0;

      await this.processInChunks(categoryTransactions, async (chunk) => {
        chunk.forEach(t => {
          categoryTotal += t.amount;
          categoryCount++;
        });
      });

      const categoryAverage = categoryCount > 0 ? categoryTotal / categoryCount : 0;

      // Process monthly transactions in chunks
      const monthYear = `${transaction.date.getMonth() + 1}/${transaction.date.getFullYear()}`;
      const monthlyTransactions = account.transactions.filter(t => 
        t.category === transaction.category &&
        `${t.date.getMonth() + 1}/${t.date.getFullYear()}` === monthYear &&
        t._id.toString() !== transactionId
      );

      let monthlyTotal = 0;
      let monthlyCount = 0;

      await this.processInChunks(monthlyTransactions, async (chunk) => {
        chunk.forEach(t => {
          monthlyTotal += t.amount;
          monthlyCount++;
        });
      });

      const monthlyAverage = monthlyCount > 0 ? monthlyTotal / monthlyCount : 0;

      const results = {
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
          frequency: await this.getCategoryFrequency(account.transactions, transaction.category),
          isRecurring: await this.isRecurringTransaction(account.transactions, transaction)
        }
      };

      // Cache the results
      cache.put(cacheKey, results, CACHE_DURATION);
      res.json(results);

    } catch (error) {
      res.status(500).json({ message: 'Error fetching transaction insights', error: error.message });
    }
  }

  // Updated helper methods to use chunking
  static async getCategoryFrequency(transactions, category) {
    let categoryCount = 0;
    
    await this.processInChunks(transactions, async (chunk) => {
      chunk.forEach(t => {
        if (t.category === category) {
          categoryCount++;
        }
      });
    });

    return {
      daily: categoryCount / 30, // Average per day
      monthly: categoryCount / 12, // Average per month
      total: categoryCount
    };
  }

  static async isRecurringTransaction(transactions, currentTransaction) {
    let similarCount = 0;
    const uniqueMonths = new Set();

    await this.processInChunks(transactions, async (chunk) => {
      chunk.forEach(t => {
        if (t.category === currentTransaction.category &&
            Math.abs(t.amount - currentTransaction.amount) < 1 &&
            t._id.toString() !== currentTransaction._id.toString()) {
          similarCount++;
          uniqueMonths.add(`${t.date.getMonth()}-${t.date.getFullYear()}`);
        }
      });
    });

    return uniqueMonths.size >= 2;
  }

  // Get overall insights across all accounts
  static async getOverallInsights(req, res) {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const pipeline = [
        // Match company accounts
        { $match: { company: req.user.company._id } },
        
        // Facet for parallel processing
        {
          $facet: {
            // Account level metrics
            accountMetrics: [
              {
                $group: {
                  _id: null,
                  totalAccounts: { $sum: 1 },
                  totalBalance: { $sum: '$balance' },
                  highestBalance: { $max: '$balance' },
                  highestBalanceAccount: {
                    $first: {
                      $cond: [
                        { $eq: ['$balance', { $max: '$balance' }] },
                        '$_id',
                        null
                      ]
                    }
                  }
                }
              }
            ],

            // Transaction metrics
            transactionMetrics: [
              { $unwind: '$transactions' },
              {
                $group: {
                  _id: null,
                  totalTransactions: { $sum: 1 },
                  totalIncome: {
                    $sum: {
                      $cond: [{ $eq: ['$transactions.type', 'income'] }, '$transactions.amount', 0]
                    }
                  },
                  totalExpenses: {
                    $sum: {
                      $cond: [{ $eq: ['$transactions.type', 'expense'] }, '$transactions.amount', 0]
                    }
                  }
                }
              }
            ],

            // Category breakdown
            categoryBreakdown: [
              { $unwind: '$transactions' },
              {
                $group: {
                  _id: '$transactions.category',
                  total: { $sum: '$transactions.amount' },
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } }
            ],

            // Monthly trends
            monthlyTrends: [
              { $unwind: '$transactions' },
              {
                $match: {
                  'transactions.date': { $gte: sixMonthsAgo }
                }
              },
              {
                $group: {
                  _id: {
                    month: { $month: '$transactions.date' },
                    year: { $year: '$transactions.date' }
                  },
                  income: {
                    $sum: {
                      $cond: [{ $eq: ['$transactions.type', 'income'] }, '$transactions.amount', 0]
                    }
                  },
                  expenses: {
                    $sum: {
                      $cond: [{ $eq: ['$transactions.type', 'expense'] }, '$transactions.amount', 0]
                    }
                  }
                }
              }
            ]
          }
        }
      ];

      const [results] = await BankAccount.aggregate(pipeline);
      
      // Format the response
      const accountMetrics = results.accountMetrics[0] || {
        totalAccounts: 0,
        totalBalance: 0
      };
      
      const transactionMetrics = results.transactionMetrics[0] || {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0
      };

      res.json({
        overallSummary: {
          totalAccounts: accountMetrics.totalAccounts,
          totalBalance: accountMetrics.totalBalance,
          totalTransactions: transactionMetrics.totalTransactions,
          totalIncome: transactionMetrics.totalIncome,
          totalExpenses: transactionMetrics.totalExpenses,
          netCashflow: transactionMetrics.totalIncome - transactionMetrics.totalExpenses
        },
        accountMetrics: {
          averageAccountBalance: accountMetrics.totalAccounts > 0 ?
            accountMetrics.totalBalance / accountMetrics.totalAccounts : 0,
          accountWithHighestBalance: {
            id: accountMetrics.highestBalanceAccount,
            balance: accountMetrics.highestBalance
          }
        },
        categoryBreakdown: results.categoryBreakdown.reduce((acc, cat) => {
          acc[cat._id] = {
            total: cat.total,
            count: cat.count
          };
          return acc;
        }, {}),
        monthlyTrends: results.monthlyTrends.reduce((acc, item) => {
          const monthYear = `${item._id.month}/${item._id.year}`;
          acc[monthYear] = {
            income: item.income,
            expenses: item.expenses
          };
          return acc;
        }, {})
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
 
      // Status breakdown - handle null/undefined status
      const statusBreakdown = leads.reduce((acc, lead) => {
        const status = lead.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      // Source breakdown - remove console.log and handle null/undefined
      const sourceBreakdown = leads.reduce((acc, lead) => {
        const source = lead.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});
      
      // Source vs Conversion breakdown - analyze which sources convert best
      const sourceConversionBreakdown = leads.reduce((acc, lead) => {
        const source = lead.source || 'Unknown';
        if (!acc[source]) {
          acc[source] = { total: 0, converted: 0, conversionRate: 0 };
        }
        acc[source].total += 1;
        if (lead.status === 'Converted') {
          acc[source].converted += 1;
        }
        return acc;
      }, {});
      
      // Calculate conversion rates for each source
      Object.keys(sourceConversionBreakdown).forEach(source => {
        const { total, converted } = sourceConversionBreakdown[source];
        sourceConversionBreakdown[source].conversionRate = total > 0 ? 
          (converted / total) * 100 : 0;
      });
      
      // Campaign breakdown - handle null/undefined campaign
      const campaignBreakdown = leads.reduce((acc, lead) => {
        if (lead.campaignid && lead.campaignid.name) {
          acc[lead.campaignid.name] = (acc[lead.campaignid.name] || 0) + 1;
        } else {
          acc['No Campaign'] = (acc['No Campaign'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Assigned to breakdown - safer property access
      const assignedToBreakdown = leads.reduce((acc, lead) => {
        if (lead.assignedTo && lead.assignedTo.name) {
          acc[lead.assignedTo.name] = (acc[lead.assignedTo.name] || 0) + 1;
        } else {
          acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Monthly trends (last 6 months) - handle missing createdAt
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyTrends = leads
        .filter(lead => lead.createdAt && lead.createdAt >= sixMonthsAgo)
        .reduce((acc, lead) => {
          const monthYear = `${lead.createdAt.getMonth() + 1}/${lead.createdAt.getFullYear()}`;
          if (!acc[monthYear]) {
            acc[monthYear] = { count: 0 };
          }
          acc[monthYear].count += 1;
          return acc;
        }, {});
      
      // Conversion rate - handle null/undefined status
      const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      // Untouched leads - handle null/undefined untouched
      const untouchedLeads = leads.filter(lead => lead.untouched === true).length;
      
      res.json({
        overallSummary: {
          totalLeads,
          convertedLeads,
          conversionRate,
          untouchedLeads,
          untouchedPercentage: totalLeads > 0 ? (untouchedLeads / totalLeads) * 100 : 0
        },
        statusBreakdown,
        sourceBreakdown,
        sourceConversionBreakdown,
        campaignBreakdown,
        assignedToBreakdown,
        monthlyTrends,
        metrics: {
          averageNotesPerLead: totalLeads > 0 ? 
            leads.reduce((sum, lead) => sum + (lead.notes && Array.isArray(lead.notes) ? lead.notes.length : 0), 0) / totalLeads : 0,
          mostCommonStatus: Object.keys(statusBreakdown).length > 0 ? getMostFrequentFromObject(statusBreakdown) : 'None',
          mostCommonSource: Object.keys(sourceBreakdown).length > 0 ? getMostFrequentFromObject(sourceBreakdown) : 'None',
          mostEffectiveSource: Object.keys(sourceConversionBreakdown).length > 0 ? 
            Object.entries(sourceConversionBreakdown)
              .filter(([_, data]) => data.total >= 5) // Only consider sources with at least 5 leads
              .sort(([k1, a], [k2, b]) => b.conversionRate - a.conversionRate)[0]?.[0] || 'None' : null,
          mostActiveAssignee: Object.keys(assignedToBreakdown).length > 0 ? getMostFrequentFromObject(assignedToBreakdown) : 'None'
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

  // Cache management methods
  static async clearCache(req, res) {
    try {
      const { type, id } = req.query;
      
      if (type && id) {
        // Clear specific cache
        const pattern = `${type}-${id}*`;
        await redisCloud.deletePattern(pattern);
      } else {
        // Clear all cache
        await redisCloud.clearAll();
      }

      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error clearing cache', error: error.message });
    }
  }

  // Cleanup method
  static async cleanup() {
    // Cleanup worker threads
    for (const worker of this.workerPool.values()) {
      worker.terminate();
    }
    this.workerPool.clear();

    // Close Redis connection
    await redis.quit();
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
