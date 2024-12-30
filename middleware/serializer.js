const FastJson = require('fast-json-stringify');

const createFastSerializer = (schema) => {
  const stringify = FastJson(schema);
  
  return (req, res, next) => {
    res.sendJSON = (data) => {
      const serialized = stringify(data);
      res.setHeader('Content-Type', 'application/json');
      res.send(serialized);
    };
    next();
  };
};

module.exports = createFastSerializer;
