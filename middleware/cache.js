
const nodeCache = require('node-cache');
const cache = new nodeCache({ stdTTL: 300 }); // 5 minutes default TTL

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.send(cachedResponse);
    }

    res.originalSend = res.send;
    res.send = (body) => {
      cache.set(key, body, duration);
      res.originalSend(body);
    };
    next();
  };
};

module.exports = cacheMiddleware;