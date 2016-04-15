'use strict';

var LZString = require('lz-string');

var storageManage = (function(storageType, compress) {
  var isCompress = compress;

  function getValue(key) {
    if (typeof key !== 'string') {
      return;
    }

    var value;
    if (storageType === "L") {
      value = localStorage.getItem(key);
    } else {
      value = sessionStorage.getItem(key);
    }

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

  function removeKey(key) {
    if (typeof key !== 'string') {
      console.error('Miss the key!');
      return;
    }

    if (storageType === "L") {
      localStorage.removeItem(key);
    } else {
      sessionStorage.removeItem(key);
    }
  }

  function setValue(key, value) {
    if (typeof key !== 'string') {
      console.error('Miss the key!');
      return;
    }

    value = String(value);
    if (isCompress)
      value = LZString.compress(value);

    if (storageType === "L") {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  }

  return {
    getValue : getValue,
    removeKey: removeKey,
    setValue : setValue
  }
});

module.exports = storageManage;
