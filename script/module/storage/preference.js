'use strict';

/*
  - Lacal storage 에 저장 되는 preference 관련 포맷
  key : preference_[activeEmplId]
  value : format is JSON.
  {
    "company": "uangle",
    "LoginId": jerry,
    "coId": 1
  }
*/

var preference = (function(storage, emplId) {
  var activeEmplId = emplId;
  var keyName  = "preference_" + activeEmplId;
  var preferenceJson = {};
  var storageManager = storage;

  function _readAll() {
    var value = storageManager.getValue(keyName);
    if(value) {
      preferenceJson = JSON.parse(value);
    }
  }

  function _writeAll() {
    storageManager.setValue(keyName, JSON.stringify(preferenceJson));
  }

  function getPreference(key) {
    if (typeof key !== 'string') {
      console.error('Miss the key!');
      return;
    }
    _readAll();
    return preferenceJson[key];
  }

  function setPreference(key, value) {
    if (typeof key !== 'string') {
      console.error('Miss the key!');
      return;
    }

    if (typeof value === "undefined") {
      console.error('Miss the value');
      return;
    }
    _readAll();
    preferenceJson[key] = String(value);
    _writeAll();
  }

  return {
    setPreference: setPreference,
    getPreference: getPreference
  };
});

module.exports = preference;
