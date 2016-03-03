window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');

var constants = require("C:/electron/teamon/script/constants.js");
var fs = require('fs');
var EmplRes = require("C:/electron/teamon/script/rest/empl");
var LoginRes = require("C:/electron/teamon/script/rest/login");

function initialize(){
  restResourse = {
    empl : new EmplRes(),
    login : new LoginRes()
  };

  console.log("call Teamon in teamon.js");
  var self = this;

  var dialogOptions = {
      backdrop : "static",
      keyboard : "false",
      backgroundOpacity : 1,
      backgroundColor : "#2f4050"
    };

  openModalDialog("./user/login_popup.html", dialogOptions);
}

$(document).ready(function() {
  initialize();
});
