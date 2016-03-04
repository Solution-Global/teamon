window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
var fs = require('fs');

constants = require("./script/constants"); // global var
storageManager = require('./script/storage/storage_manager')(false); // global var

// REST
var emplRes = require("./script/rest/empl");
var loginRes = require("./script/rest/login");
var chatRes = require("./script/rest/chat");
var channelRes = require("./script/rest/channel");
var callHistoryRes = require("./script/rest/call_history");
var companyRes = require("./script/rest/company");

var preferenceManager = require('./script/storage/preference');

function initialize(){
  restResourse = {
    empl : new emplRes(),
    login : new loginRes(),
    chat : new chatRes(),
    channel : new channelRes(),
    callHistory : new callHistoryRes(),
    company : new companyRes()
  }; // global var

  initLoginStatus();
}

function initLoginStatus() {
  var remeberLoginId = storageManager.getValue("remeberLoginId");
  console.log("initLoginStatus[remeberLoginId:%s]", remeberLoginId);

  if(remeberLoginId) {
    myPreference = new preferenceManager(storageManager, remeberLoginId); // init preference

    loginInfo = {
      "company": myPreference.getPreference("company"),
      "loginId": myPreference.getPreference("loginId"),
      "emplId": myPreference.getPreference("emplId"),
      "apiAuthKey": myPreference.getPreference("apiAuthKey"),
      "coId": myPreference.getPreference("coId")
    };

    // initScreenSection();
  } else {
    var dialogOptions = {
      backdrop : "static",
      keyboard : "false",
      backgroundOpacity : 1,
      backgroundColor : "#2f4050"
    };
    openModalDialog("./user/login_popup.html", dialogOptions);
  }
}

$(document).ready(function() {
  initialize();
});
