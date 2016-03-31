window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
require('malihu-custom-scrollbar-plugin')($);

fs = require('fs');
path = require('path');
moment = require('moment-timezone');
Mustache = require('mustache');
Dropzone = require('dropzone');
constants = require("./script/constants"); // global var
preferenceManager = require('./script/storage/preference'); // global var
messageManager = require('./script/message'); // global var
chatModule = require('./script/chat_client'); // global var
// CallClient = require('./script/call_client');
notifierModule = require('./script/notification'); //global var
cacheManager = require('./script/uCache'); // global var
toastr = require("./script/plugins/toastr/toastr.min"); // global var
timezone = "Asia/Seoul";
autosize = require('autosize');
trayModule = null;
myWindow = null;
infoSectionFlag = true;
timerListForLastMsg = []; // lastMsgId를 관리하기 위한 Tiver Event의 ID를 저장하는 global 변수

function initialize(){
  if(window && window.process && window.process.type) {
    // For desktop
    runningChannel = constants.CHANNEL_APP;
    aplUrl = "http://192.168.1.164:7587/rest/";
    UPLOAD_URL = "http://192.168.1.164:7587/upload/";
    IMAGE_URL= "http://192.168.1.164:8083/image/";

    trayModule = require('./script/tray_menu');
    trayModule.renderTrayIconMenu();
  } else {
    // For WEB
    navigator.geolocation.getCurrentPosition(function(position) {
      console.trace(position);
    });
    runningChannel = constants.CHANNEL_WEB;
    aplUrl = location.protocol + "//" + location.host + "/rest/";
    UPLOAD_URL = location.protocol + "//" + location.host + "/upload/";
    IMAGE_URL= location.protocol + "//" + location.host + "/image/";
  }

  // declare global var
  loginInfo = null;
  activeChatInfo = null;
  var storageManager = require('./script/storage/storage_manager'); // global var
  localStorageManager = storageManager("L", false);
  sessionStorageManager = storageManager("S", false);

  initAPI(); // 로그인전에 기본으로 사용할 API 초기화 설정
  initLoginStatus();
}

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

    var uaParser = new UAParser();
    uaParser.setUA(navigator.userAgent);

    loginInfo = {
      "email": myPreference.getPreference("email"),
      "authKey": myPreference.getPreference("authKey"),
      "teamId": Number(myPreference.getPreference("teamId")),
      "emplId": Number(myPreference.getPreference("emplId")),
      "name": myPreference.getPreference("name"),
      "browser": uaParser.getBrowser().name + (uaParser.getBrowser().name === "IE" ? uaParser.getBrowser().major : ""),
      "os": uaParser.getOS().name + (uaParser.getOS().name === "Windows" ? uaParser.getOS().version : ""),
      "device": uaParser.getDevice().model === undefined ? "" : uaParser.getDevice().model,
      "photoLoc": myPreference.getPreference("photoLoc")
    };
    initAPI();

    // let server knows that I've signed in
    restResource.login.loggedIn(loginInfo);

    loadAllArea();
    chatModule.configMyInfo(loginInfo.teamId, loginInfo.emplId);

  } else {
    var dialogOptions = {
      backdrop : "static",
      keyboard : "false",
      backgroundOpacity : 1,
      backgroundColor : "#2f4050"
    };
    openModalDialog("/user/login_popup.html", dialogOptions);
  }
}


runTimerForSetLastMsgId = function(topic, chatId) {
  console.info("runTimerForSetLastMsgId topic %s, chatId %s", topic, chatId);
  clearTimeout(timerListForLastMsg[topic]); // 기존 timer 삭제 후 초기화
  timerListForLastMsg[topic] = setTimeout(function() {shareLastMsgId(topic,chatId);}, constants.LAST_MST_ID_TIMER_INTERVAL);
};

shareLastMsgId = function(topic, chatId) {
  console.info("shareLastMsgId topic %s, chatId %s", topic, chatId);
  var params = {
    "lastMsgId": chatId,
    "topic": topic,
    "emplId": loginInfo.emplId
  };
  if(chatId) {
    restResource.chat.updateLastMsg(params);
    myMessage.setLastReadMessageId(topic, chatId);
    chatModule.sendLastMsgId(topic, chatId);
  }

  delete timerListForLastMsg[topic]; //
};

handleLastMsgId = function(payload) {
  console.info("handleLastMsgId payload %s", JSON.stringify(payload));

  // 멀티 로그인을 고려하여 같이 기종의 alarm count를 초기화 하기 위해서 필요
  if(loginInfo.emplId === payload.senderId) {
    var localLastMstId = myMessage.getLastReadMessageId(payload.topic);
    if(localLastMstId && localLastMstId < payload.lastMsgId) {
      myMessage.setLastReadMessageId(payload.topic, payload.lastMsgId);
      hideChattingAlram(payload.topic);
    }
  }
};

handleCommand = function(receiver, commandPayload) {
  console.info("handleCommand information %s, %s", receiver, commandPayload.toString());

  if(receiver != loginInfo.emplId) {
    console.error("receiver not match %s, %s", receiver, loginInfo.emplId);
    return;
  }

  switch (commandPayload.type) {
    // channel 관련
    case constants.CHANNEL_CREATE:
      chatModule.subscribe(getChannelTopicName(commandPayload.topic)); // channel 가입

      if(commandPayload.senderId === loginInfo.emplId) {
        chatModule.sendMsg(commandPayload.topic, "Join Channel"); // 가입 message 전송
      }
      displayCreatedChannel(commandPayload);
    break;
    case constants.CHANNEL_ADD_MEMBER:
      reloadChannelCache(commandPayload.channelId);

      // Active 채팅방과 멤버 추가되는 channel이 동일 할경우 asidesection에 member 추가
      if(activeChatInfo && activeChatInfo.channelId === commandPayload.channelId) {
        displayChannelMember(commandPayload.newMembers);
      }
    break;
    case constants.CHANNEL_REMOVE_MEMBER:
      reloadChannelCache(commandPayload.channelId);
      chatModule.unsubscribe(getChannelTopicName(commandPayload.topic)); // channel 가입해지
      if(loginInfo.emplId === commandPayload.member) {
        // 화면 닫기 & 리스트제거
        hideInformationArea();
        hideChatArea();
        hideScreenShareArea();
        removeChannel(commandPayload.channelId);
      } else {
        if(activeChatInfo && activeChatInfo.channelId === commandPayload.channelId) {
          removeChannelMember(commandPayload.member);
        }
      }
    break;
    // call 관련
    case constants.CALL_SHARE_CHID:
      callSection.setCallHistoryId(commandPayload.callHistoryId);
    break;
    default:
    console.error("invalid command[%s]", commandPayload.type);
    return;
  }
};

initAPI = function() {
  var emplRes = require("./script/rest/empl");
  var loginRes = require("./script/rest/login");
  var teamRes = require("./script/rest/team");

  restResource = {}; // global var
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

    restResource.empl =  new emplRes(params);
    restResource.login = new loginRes(params);
    restResource.team = new teamRes(params);
    restResource.chat = new chatRes(params);
    restResource.channel = new channelRes(params);
    restResource.callHistory = new callHistoryRes(params);
  } else {
    // 로그인 전 개인 인증 AuthKey를 전달 하지 않는다.
    restResource.empl =  new emplRes(params);
    restResource.login = new loginRes(params);
    restResource.team = new teamRes(params);
  }
};

loadAllArea = function() {
  loadHtml("/chat/chat_section.html", $("#chat-section"));
  loadHtml("/catalog/catalog_section.html", $("#catalog-section"));
  loadHtml("/header/header_section.html", $("#header-section"));
  // loadHtml("/screenshare/screenshare-section.html", $("#screenshare-section"));
  // loadHtml("/call/call_section.html", $("#call-section"));
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

setInfoSectionFlag = function(flag) {
  infoSectionFlag = flag;
};

showInformationArea = function(fileName) {
  if (infoSectionFlag)
  {
    $("#information-section").html("");
    loadHtml("/information/" + fileName, $("#information-section"));
    $("#information-section").show();
    $("#information-section").delegate('.aside-close-link', 'click touchend', function() {
      infoSectionFlag = false;
      $("#information-section").empty();
      $("#chat-section").removeClass("with-info");
      $("#information-section").hide();
    });
    $("#chat-section").addClass("with-info");
  }
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
