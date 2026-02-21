import NodeCache from 'node-cache';

const cache = new NodeCache();

const clearCache = () => {
  console.log('clearing cache...');

  cache.flushAll();

  console.log('cache cleared.');

  process.exit(1);
};

clearCache();
