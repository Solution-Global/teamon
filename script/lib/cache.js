var Cache = function() {
  var memory = {};

  function get(key) {
    if (typeof(memory[key]) !== 'undefined')
      return memory[key];

    return null;
  }

  function set(key, value) {
    memory[key] = value;
  }

  function getKeyArray() {
    var cacheArray = [];

    for (var key in memory) {
      if (memory.hasOwnProperty(key)) {
        cacheArray.push(key);
      }
    };

    return cacheArray;
  }

  function getValueArray() {
    var cacheArray = [];

    for (var key in memory) {
      if (memory.hasOwnProperty(key)) {
        cacheArray.push(memory[key]);
      }
    };

    return cacheArray;
  }

  function initCache() {
    memory = {};
  }

  return {
    get: get,
    set: set,
    getKeyArray: getKeyArray,
    getValueArray: getValueArray,
    initCache: initCache
  };
};

module.exports = Cache;
