const LRU = require('lru-cache');
const QuickLRU = require('quick-lru');

class SimplePredictiveCache {
  constructor() {
    this.patterns = new Map();
    this.maxPatternLength = 5;
  }

  learn(key) {
    if (!this.lastKey) {
      this.lastKey = key;
      return;
    }
    
    const pattern = `${this.lastKey}:${key}`;
    this.patterns.set(pattern, (this.patterns.get(pattern) || 0) + 1);
    this.lastKey = key;
    
    // Cleanup old patterns
    if (this.patterns.size > 1000) {
      const entries = Array.from(this.patterns.entries());
      entries.sort((a, b) => b[1] - a[1]);
      this.patterns = new Map(entries.slice(0, 500));
    }
  }

  predict(key) {
    const predictions = new Set();
    for (const [pattern, count] of this.patterns) {
      if (pattern.startsWith(key + ':') && count > 2) {
        predictions.add(pattern.split(':')[1]);
      }
    }
    return Array.from(predictions).slice(0, 3);
  }
}

const options = {
  max: 1000,
  maxSize: 10000,
  sizeCalculation: (value) => Buffer.byteLength(JSON.stringify(value)),
  ttl: 1000 * 60 * 5
};

const createOptimizedCache = () => {
  const hotCache = new QuickLRU({ maxSize: 200 });
  const mainCache = new LRU(options);
  const predictor = new SimplePredictiveCache();

  return async (req, res, next) => {
    const key = req.originalUrl;
    
    // Predictive prefetching
    const nextLikelyKeys = predictor.predict(key);
    nextLikelyKeys.forEach(predictedKey => {
      if (!hotCache.has(predictedKey) && !mainCache.has(predictedKey)) {
        // Queue prefetch for next tick to not block current request
        process.nextTick(() => {
          req.originalUrl = predictedKey;
          // Let the request flow through normal middleware
          req.emit('prefetch');
        });
      }
    });

    let cachedResponse = hotCache.get(key);
    if (!cachedResponse) {
      cachedResponse = mainCache.get(key);
      if (cachedResponse) {
        hotCache.set(key, cachedResponse);
      }
    }

    if (cachedResponse) {
      predictor.learn(key);
      return res.send(cachedResponse);
    }

    res.originalSend = res.send;
    res.send = (body) => {
      mainCache.set(key, body);
      predictor.learn(key);
      res.originalSend(body);
    };
    next();
  };
};

module.exports = createOptimizedCache;