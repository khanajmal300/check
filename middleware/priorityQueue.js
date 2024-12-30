
const FastPriorityQueue = require('fastpriorityqueue');

const createPriorityMiddleware = () => {
  const queue = new FastPriorityQueue((a, b) => a.priority < b.priority);
  let processing = false;

  const processQueue = async () => {
    if (processing || queue.isEmpty()) return;
    processing = true;

    while (!queue.isEmpty()) {
      const { handler, resolve } = queue.poll();
      await handler().then(resolve);
    }

    processing = false;
  };

  return (req, res, next) => {
    req.enqueueRequest = (handler, priority = 5) => {
      return new Promise(resolve => {
        queue.add({ handler, resolve, priority });
        processQueue();
      });
    };
    next();
  };
};

module.exports = createPriorityMiddleware;