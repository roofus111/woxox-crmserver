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

// Memory-aware throttling
async function throttleCPU(interval) {
  const memoryUsage = process.memoryUsage().heapUsed;
  const memoryFactor = memoryUsage > 400 * 1024 * 1024 ? 2 : 1; // Slow down if memory is high
  await new Promise(resolve => setTimeout(resolve, interval * memoryFactor));
}

// Process data in small batches
async function processBatch(items, processFn, cpuThrottle) {
  const results = [];
  const batchSize = 50; // Very small batches for memory constraint
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    for (const item of batch) {
      await throttleCPU(cpuThrottle);
      results.push(await processFn(item));
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Yield to allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return results;
}

// Handle messages from main thread
parentPort.on('message', async ({ chunk, operation, params, cpuThrottle }) => {
  try {
    let result;
    
    // Check memory before processing
    if (process.memoryUsage().heapUsed > 450 * 1024 * 1024) {
      throw new Error('Insufficient memory to process chunk');
    }

    if (params) {
      const processFn = new Function(`return ${params}`)();
      result = await processBatch(chunk, processFn, cpuThrottle);
    } else {
      switch (operation) {
        case 'getCategoryFrequency':
          result = await processBatch(
            chunk,
            async (t) => t.category === category ? 1 : 0,
            cpuThrottle
          );
          result = result.reduce((a, b) => a + b, 0);
          break;
        
        case 'isRecurringTransaction':
          result = await processBatch(
            chunk,
            async (t) => processTransaction(t),
            cpuThrottle
          );
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

// Memory monitoring
setInterval(() => {
  const memoryUsage = process.memoryUsage().heapUsed;
  if (memoryUsage > 450 * 1024 * 1024) {
    if (global.gc) {
      global.gc();
    }
    process.emit('warning', new Error('High memory usage in worker'));
  }
}, 1000);

// Cleanup on exit
process.on('exit', () => {
  if (global.gc) {
    global.gc();
  }
}); 