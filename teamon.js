window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
var fs = require('fs');



var constants = require("./script/constants.js");
var EmplRes = require("./script/rest/empl.js");
var LoginRes = require("./script/rest/login.js");

function initialize(){
  restResourse = {
    empl : new EmplRes(),
    login : new LoginRes()
  };

  console.log("call Teamon in teamon.js" + __dirname);
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
