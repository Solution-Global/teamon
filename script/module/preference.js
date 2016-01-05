var jsonfile = require('jsonfile')

/*
  preference 설정은 json 파일로 저장한다.
  {
      "login": { - section
          "rememberMe": false - key : value,
          "loginId": jerry,
          "password":
      },
      "notification": { - section
        "sound" : 1,
        "display" : false
      }
  }
*/

var preference = (function() {
  var prefObj;
  jsonfile.spaces = 2; // tab spaces
  var file = "config/preference.cfg";

  function _readAll() {
    prefObj = jsonfile.readFileSync(file);
  }

  function _writeAll() {
    jsonfile.writeFileSync(file, prefObj);
  }

  function get(section, key) {
    if (typeof section !== 'string') {
      console.error('Miss the section!');
      return;
    }

    if (typeof key !== 'string') {
      console.error('Miss the key!');
      return;
    }

    if (prefObj === undefined) {
      _readAll();
    }

    return prefObj[section] ? prefObj[section][key] : undefined;
  }

  function set(section, key, value, write2File) {
    if (typeof section !== 'string') {
      console.error('Miss the section!');
      return;
    }

    if (typeof key !== 'string') {
      console.error('Miss the key!');
      return;
    }

    if (typeof value === "undefined") {
      console.error('Miss the value');
      return;
    }

    write2File =  write2File || true;

    if (prefObj === undefined) {
      _readAll();
    }

    if (!prefObj[section]) {
      var temp = {};
      temp[key] = value;
      prefObj[section] = temp; // add key with section
    } else {
      prefObj[section][key] = value;
    }

    if (write2File) {
      _writeAll();
    }
  }

  function getPrefObj() {
    if (prefObj === undefined) {
      _readAll();
    }

    return prefObj;
  }

  return {
    get: get,
    set: set,
    getPrefObj: getPrefObj
  };
})();

module.exports = preference;
