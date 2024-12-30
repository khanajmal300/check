const { Transform } = require('stream');
const { Worker } = require('worker_threads');

const streamResponse = () => {
  const processingWorker = new Worker(`
    const { parentPort } = require('worker_threads');
    const { JsonStreamStringify } = require('json-stream-stringify');
    
    parentPort.on('message', async (chunk) => {
      const stringified = await new JsonStreamStringify(chunk).readToEnd();
      parentPort.postMessage(stringified);
    });
  `, { eval: true });

  return (req, res, next) => {
    res.streamJSON = (asyncIterator, chunkSize = 32768) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      const transformer = new Transform({
        highWaterMark: chunkSize,
        transform(chunk, encoding, callback) {
          processingWorker.postMessage(chunk);
          processingWorker.once('message', (processed) => {
            this.push(Buffer.from(processed));
            callback();
          });
        },
        objectMode: true
      });

      transformer.on('drain', () => asyncIterator.resume());

      asyncIterator
        .pipe(transformer)
        .pipe(res, { 
          highWaterMark: chunkSize,
          writableHighWaterMark: chunkSize
        });

      res.on('close', () => {
        asyncIterator.destroy();
        transformer.destroy();
      });
    };
    next();
  };
};

module.exports = streamResponse;
