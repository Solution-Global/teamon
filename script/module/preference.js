var jsonfile = require('jsonfile')

/*
  preference 설정은 json 파일로 저장한다.
  {
      "login": { - section
          "keepSignted": false - key : value
      },
      "notification": { - section
        "sound" : 1,
        "display" : false
      }
  }
*/

var preference = (function() {
  jsonfile.spaces = 2; // tab spaces
  var file = "config/preference.cfg";

  function get(section, key) {
    if(typeof section !== 'string' ) {
      console.error('Miss the section!');
      return;
    }

    if(typeof key !== 'string' ) {
      console.error('Miss the key!');
      return;
    }

    var readJsonObject  = jsonfile.readFileSync(file);
    return readJsonObject[section] ? readJsonObject[section][key] : undefined;
  }

  function set(section, key, value) {
    if(typeof section !== 'string' ) {
      console.error('Miss the section!');
      return;
    }

    if(typeof key !== 'string' ) {
      console.error('Miss the key!');
      return;
    }

    if(value === 'undefined') {
      console.error('Miss the value');
      return;
    }

    var readJsonObject  = jsonfile.readFileSync(file);
    if(!readJsonObject[section]) {
      var temp = {};
      temp[key] = value;
      readJsonObject[section] = temp; // add key with section
    } else {
      readJsonObject[section][key] = value;
    }
    jsonfile.writeFileSync(file, readJsonObject);
  }

  return {
    get: get,
    set: set,
  };
})();

module.exports = preference;
