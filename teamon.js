window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');

fs = require('fs');
Mustache = require('mustache');
constants = require("./script/constants"); // global var
storageManager = require('./script/storage/storage_manager')(false); // global var
preferenceManager = require('./script/storage/preference'); // global var

// REST
var emplRes = require("./script/rest/empl");
var loginRes = require("./script/rest/login");
var chatRes = require("./script/rest/chat");
var channelRes = require("./script/rest/channel");
var callHistoryRes = require("./script/rest/call_history");
var teamRes = require("./script/rest/team");

function initialize(){
  if(window && window.process && window.process.type) {
    // For desktop
    runningChannel = constants.CHANNEL_APP;
    aplUrl = "http://192.168.1.164:7587/rest";
  } else {
    // For WEB
    runningChannel = constants.CHANNEL_WEB;
    aplUrl = "https://127.0.0.1:8082/rest/";
  }

  // declare global var
  loginInfo = null;
  activeChatInfo = null;

  initAPI(); // 로그인전에 기본으로 사용할 API 초기화 설정

  // Window Close Event
  $(window).on('beforeunload', function() {
    console.log("Closing window");

    // chatSection.finalize(); // TODO clear chat, call and screen share.

    if(!storageManager.getValue("keepEmplId")) {
      myPreference.removePreference();
    }
  });

  initLoginStatus();
}

initAPI = function() {
  restResourse = {}; // global var
  var params = {
      "url" : aplUrl,
      "channel" :  runningChannel,
      "loginId" : "guest"
    };

  if(loginInfo) {
    params.authKey = loginInfo.authKey;
    params.email = loginInfo.email;

    restResourse.empl =  new emplRes(params);
    restResourse.login = new loginRes(params);
    restResourse.team = new teamRes(params);
    restResourse.chat = new chatRes(params);
    restResourse.channel = new channelRes(params);
    restResourse.callHistory = new callHistoryRes(params);
  } else {
    restResourse.empl =  new emplRes(params);
    restResourse.login = new loginRes(params);
    restResourse.team = new teamRes(params);
  }
}; // gloabl function

initScreenSection = function() {
  loadHtml("./catalog/catalog_section.html", $("#catalog-section"));
  loadHtml("./header/header_section.html", $("#header-section"));
  loadHtml("./chat/chat_section.html", $("#chat-section"));
}; // gloabl function

function initLoginStatus() {
  var keepEmplId = storageManager.getValue("keepEmplId");
  console.log("initLoginStatus[keepEmplId:%s]", keepEmplId);

  if(keepEmplId) {
    myPreference = new preferenceManager(storageManager, keepEmplId); // init preference

    loginInfo = {
      "email": myPreference.getPreference("email"),
      "authKey": myPreference.getPreference("authKey"),
      "teamId": myPreference.getPreference("teamId"),
      "emplId": myPreference.getPreference("emplId")
    };

    initAPI();
    initScreenSection();
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
