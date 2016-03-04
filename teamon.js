window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
var fs = require('fs');

constants = require("./script/constants"); // global var
storageManager = require('./script/storage/storage_manager')(false); // global var
preferenceManager = require('./script/storage/preference'); // global var

// REST
var emplRes = require("./script/rest/empl");
var loginRes = require("./script/rest/login");
var chatRes = require("./script/rest/chat");
var channelRes = require("./script/rest/channel");
var callHistoryRes = require("./script/rest/call_history");
var companyRes = require("./script/rest/company");

function initialize(){
  var aplUrl;
  if(window && window.process && window.process.type) {
    // For desktop
    runningChannel = constants.CHANNEL_APP;
    aplUrl = "http://192.168.1.164:7587/rest";
  } else {
    // For WEB
    runningChannel = constants.CHANNEL_WEB;
    aplUrl = "https://127.0.0.1:8082/rest/";
  }

  var params = {
      "url" : aplUrl,
      "channel" :  runningChannel,
      "loginId" : "system",
      "authkey" : "authKeydfjaksdjfaksjd"
  };

  restResourse = {
    empl : new emplRes(params),
    login : new loginRes(params),
    chat : new chatRes(params),
    channel : new channelRes(params),
    callHistory : new callHistoryRes(params),
    company : new companyRes(params)
  }; // global var

  loginInfo = null; // global var

  // Window Close Event
  $(window).on('beforeunload', function() {
    console.log("Closing window");
    
    // chatSection.finalize();

    if(!storageManager.getValue("remeberLoginId")) {
      myPreference.removePreference();
    }
  });

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
