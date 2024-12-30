
const memoizee = require('memoizee');

const createMemoizedMiddleware = (options = { maxAge: 5000, promise: true }) => {
  const cache = new Map();
  
  return (req, res, next) => {
    req.memoize = (fn) => {
      if (!cache.has(fn)) {
        cache.set(fn, memoizee(fn, options));
      }
      return cache.get(fn);
    };
    next();
  };
};

module.exports = createMemoizedMiddleware;