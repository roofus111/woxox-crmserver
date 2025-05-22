const { parentPort } = require('worker_threads');

// Worker operations
const operations = {
  processCategoryMetrics: (chunk) => {
    // Implementation of category metrics processing
  },
  processTransactionAnalysis: (chunk) => {
    // Implementation of transaction analysis
  }
  // Add more operations as needed
};

// Add CPU throttling helper
async function throttleCPU(interval) {
  await new Promise(resolve => setTimeout(resolve, interval));
}

// Handle messages from main thread
parentPort.on('message', async ({ chunk, operation, params, cpuThrottle }) => {
  try {
    let result;
    
    // Execute the provided function on the chunk with CPU throttling
    if (params) {
      const processFn = new Function(`return ${params}`)();
      
      // Process with throttling
      const results = [];
      for (const item of chunk) {
        await throttleCPU(cpuThrottle);
        const itemResult = await processFn(item);
        results.push(itemResult);
      }
      result = results;
    } else {
      // Default processing based on operation type with throttling
      switch (operation) {
        case 'getCategoryFrequency':
          let count = 0;
          for (const t of chunk) {
            await throttleCPU(cpuThrottle);
            if (t.category === category) count++;
          }
          result = count;
          break;
        
        case 'isRecurringTransaction':
          result = await processRecurringTransactionsThrottled(chunk, cpuThrottle);
          break;
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    }

    parentPort.postMessage(result);
  } catch (error) {
    parentPort.emit('error', error);
  }
});

// Helper functions with throttling
async function processRecurringTransactionsThrottled(transactions, cpuThrottle) {
  let result = false;
  for (const transaction of transactions) {
    await throttleCPU(cpuThrottle);
    // Process transaction logic here
  }
  return result;
}

// Process monitoring
let lastCPUTime = process.cpuUsage();
setInterval(() => {
  const currentCPUTime = process.cpuUsage(lastCPUTime);
  const totalCPUTime = currentCPUTime.user + currentCPUTime.system;
  
  // Adjust throttle if CPU usage is too high
  if (totalCPUTime > 500000) { // 50ms of CPU time per 100ms interval
    process.emit('warning', new Error('High CPU usage detected'));
  }
  
  lastCPUTime = process.cpuUsage();
}, 100);

// Cleanup on exit
process.on('exit', () => {
  // Perform any necessary cleanup
}); 