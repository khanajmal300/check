const { Worker } = require('worker_threads');
const workerpool = require('workerpool');
const os = require('os');

const CORE_COUNT = os.cpus().length;
const LOAD_THRESHOLD = 0.8;

const pool = workerpool.pool(__dirname + '/workers/', {
  minWorkers: Math.floor(CORE_COUNT / 2),
  maxWorkers: CORE_COUNT * 2,
  workerType: 'thread',
  statsInterval: 2000,
  onCreateWorker: () => {
    process.nextTick(() => pool.stats()); // Update stats immediately
  }
});

const workerMiddleware = () => {
  const taskQueue = new Map();
  
  setInterval(() => {
    const stats = pool.stats();
    if (stats.activeTasks / stats.totalWorkers > LOAD_THRESHOLD) {
      pool.maxWorkers = Math.min(pool.maxWorkers + 2, CORE_COUNT * 3);
    }
  }, 5000);

  return (req, res, next) => {
    req.executeHeavyTask = async (taskFn, data, priority = 1) => {
      const task = {
        fn: taskFn,
        data,
        priority,
        timestamp: Date.now()
      };

      try {
        if (pool.stats().busyWorkers / pool.stats().totalWorkers > 0.9) {
          await new Promise(resolve => setTimeout(resolve, 10 * priority));
        }
        
        return await pool.exec(taskFn, [data], {
          priority: priority
        });
      } catch (error) {
        console.error('Worker execution failed:', error);
        throw error;
      }
    };
    next();
  };
};

module.exports = workerMiddleware;
