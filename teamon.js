window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
require('malihu-custom-scrollbar-plugin')($);

fs = require('fs');
path = require('path');
moment = require('moment-timezone');
Mustache = require('mustache');
constants = require("./script/constants"); // global var
preferenceManager = require('./script/storage/preference'); // global var
messageManager = require('./script/storage/message.js'); // global var
chatModule = require('./script/chat_client.js'); // global var
cacheManager = require('./script/uCache'); // global var

timezone = "Asia/Seoul";

function initialize(){
  if(window && window.process && window.process.type) {
    // For desktop
    runningChannel = constants.CHANNEL_APP;
    aplUrl = "http://192.168.1.164:7587/rest";
  } else {
    // For WEB
    runningChannel = constants.CHANNEL_WEB;
    aplUrl = "http://192.168.1.164:8082/rest/";
  }

  // declare global var
  loginInfo = null;
  activeChatInfo = null;
  var storageManager = require('./script/storage/storage_manager'); // global var
  localStorageManager = storageManager("L", false);
  sessionStorageManager = storageManager("S", false);

  initAPI(); // 로그인전에 기본으로 사용할 API 초기화 설정
  initLoginStatus();
  // resizeSection();
  // $(window).resize(function() {
  //   resizeSection();
  // });
}

// function resizeSection() {
//   var windowHeight = $(window).height();
//   var headerHeight = $("#header-section").outerHeight(true);
//   var $informationSec = $("#information-section");
//   var $catalogSec = $("#catalog-section");
//   var $chatSec = $("#chat-section");
//
//   var informationHeaderHeight =  $informationSec.find(".ibox-title").outerHeight(true);
//   var informationHeight =  windowHeight - headerHeight - informationHeaderHeight;
//   $informationSec.find(".ibox-content").css("height", informationHeight);
//
//   var headerHeight = $("#header-section").outerHeight(true);
//   var chatInputHeight = $chatSec.find(".ibox-footer").outerHeight(true);
//   var chatHeight =  windowHeight - headerHeight - chatInputHeight - 1;
//
//   var catalogHeaderHeight = $catalogSec.find(".nav-header").outerHeight(true);
//   var catalogChannelsHeight = $catalogSec.find(".channels-link").outerHeight(true);
//   var catalogUsersHeight = $catalogSec.find(".users-link").outerHeight(true);
//
//     // 마지막의 3,2,1 오차 pixel.
//   var scrollHeight = windowHeight - catalogHeaderHeight - catalogChannelsHeight - catalogUsersHeight - 3;
//
//   $catalogSec.find('.chat-channels').css("height", scrollHeight * 0.3 );
//   $catalogSec.find('.chat-users').css("height", scrollHeight * 0.7 );
// }

function initLoginStatus() {
  var keepEmplId = localStorageManager.getValue("keepEmplId");
  var sessionEmplId = sessionStorageManager.getValue("sessionEmplId");

  console.log("initLoginStatus[keepEmplId:%s, sessionEmplId:%s]", keepEmplId, sessionEmplId);

  if(keepEmplId || sessionEmplId) {
    if(keepEmplId) {
      myPreference = new preferenceManager(localStorageManager, keepEmplId); // init preference
      sessionStorageManager.setValue("sessionEmplId", keepEmplId);
    } else {
      myPreference = new preferenceManager(localStorageManager, sessionEmplId); // init preference
    }

    loginInfo = {
      "email": myPreference.getPreference("email"),
      "authKey": myPreference.getPreference("authKey"),
      "teamId": Number(myPreference.getPreference("teamId")),
      "emplId": Number(myPreference.getPreference("emplId")),
      "name": myPreference.getPreference("name"),
    };
    initAPI();
    loadAllArea();
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

initAPI = function() {
  var emplRes = require("./script/rest/empl");
  var loginRes = require("./script/rest/login");
  var teamRes = require("./script/rest/team");

  restResourse = {}; // global var
  var params = {
      "url" : aplUrl,
      "channel" :  runningChannel
    };

  if(loginInfo) {
    var chatRes = require("./script/rest/chat");
    var channelRes = require("./script/rest/channel");
    var callHistoryRes = require("./script/rest/call_history");

    params.authKey = loginInfo.authKey;
    params.email = loginInfo.email;

    restResourse.empl =  new emplRes(params);
    restResourse.login = new loginRes(params);
    restResourse.team = new teamRes(params);
    restResourse.chat = new chatRes(params);
    restResourse.channel = new channelRes(params);
    restResourse.callHistory = new callHistoryRes(params);
  } else {
    // 로그인 전 개인 인증 AuthKey를 전달 하지 않는다.
    restResourse.empl =  new emplRes(params);
    restResourse.login = new loginRes(params);
    restResourse.team = new teamRes(params);
  }
};

loadAllArea = function() {
  loadHtml("./chat/chat_section.html", $("#chat-section"));
  loadHtml("./catalog/catalog_section.html", $("#catalog-section"));
  loadHtml("./header/header_section.html", $("#header-section"));
  // loadHtml("./screenshare/screenshare-section.html", $("#screenshare-section"));
  // loadHtml("./call/call-section.html", $("#call-section"));
};

showCatalogArea = function() {
  $("#catalog-section").show();
};

showHeaderArea = function() {
  $("#header-section").show();
};

showChatArea = function() {
  $("#chat-section").show();
};

showScreenShareArea = function() {
  $("#screenshare-section").show();
};

showCallArea = function() {
  $("#call-section").show();
};

showInformationArea = function(fileName) {
  $("#information-section").html("");
  loadHtml("./information/" + fileName, $("#information-section"));
  $("#information-section").show();
};

hideCatalogArea = function() {
  $("#catalog-section").hide();
};

hideHeaderArea = function() {
  $("#header-section").hide();
};

hideChatArea = function() {
  $("#chat-section").hide();
};

hideScreenShareArea = function() {
  $("#screenshare-section").hide();
};

hideCallArea = function() {
  $("#call-section").hide();
};

hideInformationArea = function() {
  $("#information-section").hide();
};

$(document).ready(function() {
  initialize();
});
