
const compression = require('compression');

const compressionMiddleware = compression({
  level: 6, // balance between compression speed and ratio
  threshold: 1024 // only compress responses larger than 1KB
});

module.exports = compressionMiddleware;