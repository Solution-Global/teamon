'use strict';

var LZString = require('lz-string');

var storageManage = (function(compress) {
  var isCompress = compress;

  function getValue(key) {
    if (typeof key !== 'string') {
      return;
    }

    var value = localStorage.getItem(key);
    if (value != null && isCompress) {
      value = LZString.decompress(value);
    }

    switch (value) {
      case "undefined":
        return undefined;
      case "null":
        return null;
      case "true":
        return true;
      case "false":
        return false;
      default:
        return value;
    }
  }

  function setValue(key, value) {
    if (typeof key !== 'string') {
      console.error('Miss the key!');
      return;
    }

    value = String(value);
    if(isCompress)
      localStorage.setItem(key, LZString.compress(value));
    else
      localStorage.setItem(key, value);
  }

  return {
    getValue : getValue,
    setValue : setValue
  }
});

module.exports = storageManage;
