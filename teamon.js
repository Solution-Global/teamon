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
PreferenceManager = require('./script/storage/preference'); // global var
MessageManager = require('./script/message'); // global var
chatModule = require('./script/chat_client'); // global var
CallClient = require('./script/call_client');
notifierModule = require('./script/notification'); //global var
CacheManager = require('./script/uCache'); // global var
toastr = require("./script/plugins/toastr/toastr.min"); // global var
timezone = "Asia/Seoul";
autosize = require('autosize');
trayModule = null;
myWindow = null;
myMessage = null;
isShowInfoSection = true;
timerListForLastMsg = []; // lastMsgId를 관리하기 위한 Tiver Event의 ID를 저장하는 global 변수

// initialize everything before show all the screen elements to user
initialize = function(loggedIn) {
  // console.debug("initialize");
  if (loggedIn) {
    Chain()(
      // 1. show block screen
      [showBlockScreen],
      // 2. load data
      // 2.1. get user list
      [_loadUserList],
      // 2.2. set user status online
      [_loadOnlineUserList],
      // 3. load screen element
      function(res, chain) {
        loadAllArea();
        chain.next();
      },
      // 4. synchronize chat message
      [_syncChatMessage]
    )("done", _initEnd);
  } else {
    Chain()(
      // 1. show block screen
      [showBlockScreen],
      // 2. init and declre variables
      [_initVariables],
      // 3. bind commonly used events
      [_bindCommonEvent],
      // 4. init API before login
      [_initAPI],
      // 5. check login status, if not open login page
      [_initLoginInfo],
      // 6. load data
      // 6.1. get user list
      [_loadUserList],
      // 6.2. set user status online
      [_loadOnlineUserList],
      // 7. load screen element
      function(res, chain) {
        loadAllArea();
        chain.next();
      },
      // 8. synchronize chat message
      [_syncChatMessage]
    )("done", _initEnd);
  }

  function _initEnd(callback) {
    // console.debug("End of the call chain");
    // close login dialog when sync finished
    $('#login-form').closest(".modal-dialog").closest(".modal").modal("hide");
    removeBlockScreen();
  }

  function _initVariables(callback) {
    // console.debug("initVariables");
    if (window && window.process && window.process.type) {
        // For desktop
        runningChannel = constants.CHANNEL_APP;
        API_URL = constants.API_URL;
        UPLOAD_URL = constants.UPLOAD_URL;

        trayModule = require('./script/tray_menu');
        trayModule.renderTrayIconMenu();
    } else {
        // For WEB
        navigator.geolocation.getCurrentPosition(function(position) {
            console.trace(position);
        });
        runningChannel = constants.CHANNEL_WEB;
        API_URL = location.protocol + "//" + location.host + "/rest/";
        UPLOAD_URL = location.protocol + "//" + location.host + "/upload/";
    }

    loginInfo = null;
    activeChatInfo = null;
    var StorageManager = require('./script/storage/storage_manager'); // global var
    localStorageManager = StorageManager("L", true);
    sessionStorageManager = StorageManager("S", false);

    userCache = new CacheManager(); // user list
    channelCache = new CacheManager(); // channel list
    myMessage = MessageManager(localStorageManager); // global var

    if (callback)
      callback();
  }

  function _bindCommonEvent(callback) {
    // console.debug("bindCommonEvent");
    $("body").on("click", ".about-user", function() {
        isShowInfoSection = true;
        showInformationArea(constants.INFO_AREA_ABOUT_USER, {
            "emplId": $(this).data("emplid")
        });
    });

    // prevent drag and drop files except file upload
    window.addEventListener("dragover", function(e) {
      e = e || event;
      e.preventDefault();
    }, false);
    window.addEventListener("drop", function(e) {
      e = e || event;
      e.preventDefault();
    }, false);

    if (callback)
      callback();
  }

  function _initAPI(callback) {
    // console.debug("initAPI");
    var emplRes = require("./script/rest/empl");
    var loginRes = require("./script/rest/login");
    var teamRes = require("./script/rest/team");
    var chatRes = require("./script/rest/chat");
    var channelRes = require("./script/rest/channel");
    var callHistoryRes = require("./script/rest/call_history");

    restResource = {}; // global var
    var params = {
        "url": API_URL,
        "channel": runningChannel
    };

    // API초기화 시(로그인전) 개인 인증 AuthKey를 전달 하지 않는다.
    restResource.empl = new emplRes(params);
    restResource.login = new loginRes(params);
    restResource.team = new teamRes(params);
    restResource.chat = new chatRes(params);
    restResource.channel = new channelRes(params);
    restResource.callHistory = new callHistoryRes(params);

    if (callback)
      callback();
  }

  function _initLoginInfo(callback) {
    // console.debug("initLoginInfo");
    var keepEmplId = localStorageManager.getValue("keepEmplId");
    var sessionEmplId = sessionStorageManager.getValue("sessionEmplId");

    if (keepEmplId || (sessionEmplId && !!localStorage.getItem("preference_" + sessionEmplId))) {
      // if already logged in, get info from API and set them again
      if (keepEmplId) {
          myPreference = new PreferenceManager(localStorageManager, keepEmplId); // init preference
          sessionStorageManager.setValue("sessionEmplId", keepEmplId);
      } else {
          myPreference = new PreferenceManager(localStorageManager, sessionEmplId); // init preference
      }

      configureCertifiedAPI(myPreference.getPreference("email"), myPreference.getPreference("authKey"));
      restResource.empl.getMyInfo({ emplId: myPreference.getPreference("emplId") }, function(data) {
        var uaParser = new UAParser().setUA(navigator.userAgent);
        loginInfo = {
          email: data.email,
          authKey: data.authKey,
          teamId: Number(data.teamId),
          emplId: Number(data.emplId),
          name: data.name,
          browser: uaParser.getBrowser().name + (uaParser.getBrowser().name === "IE" ? uaParser.getBrowser().major : ""),
          os: uaParser.getOS().name + (uaParser.getOS().name === "Windows" ? uaParser.getOS().version : ""),
          device: uaParser.getDevice().model === undefined ? "" : uaParser.getDevice().model,
          photoLoc: data.photoLoc
        };

        // let server knows that I've signed in
        restResource.login.loggedIn(loginInfo);
        chatModule.configMyInfo(loginInfo.teamId, loginInfo.emplId);

        if (callback)
          callback();
      });
    } else {
      var dialogOptions = {
          backdrop: "static",
          keyboard: "false",
          backgroundOpacity: 1,
          backgroundColor: "#2f4050"
      };
      openModalDialog("/user/login_popup.html", dialogOptions);
      removeBlockScreen();
      return;
    }
  }

  function _loadUserList(callback) {
    // console.debug("_loadUserList");
    var params = {
      "teamId": loginInfo.teamId,
      "limit": constants.COMMON_SEARCH_ALL,
      "sIdx": "name",
      "sOrder": "asc"
    };
    restResource.empl.getListByTeamId(params, function(data) {
      if (data.rows) {
        $.each(data.rows, function(idx, row) {
           userCache.set(row.emplId, row); // add each employee into userCache.
        });
      }
      if (callback)
        callback();
    });
  }

  // load online user list and set it online on userCache
  function _loadOnlineUserList(callback) {
    // console.debug("_loadOnlineUserList");
    restResource.login.getLoggedInEmplListByTeamId({ "teamId": loginInfo.teamId }, function(data) {
      if (data) {
        $.each(data, function() {
          userCache.get(this.emplId).online = true;
        });
      }

      if (callback)
        callback();
    });
  }

  function _syncChatMessage(callback) {
    // console.debug("syncChatMessage");
    myMessage.syncChatMessage(constants.DIRECT_CHAT, userCache.getValueArray(), function() {
      myMessage.syncChatMessage(constants.CHANNEL_CHAT, channelCache.getValueArray(), function() {
        activeLastChatView();
        // close login dialog when sync finished
        $('#login-form').closest(".modal-dialog").closest(".modal").modal("hide");
        if (callback)
          callback();
      });
    });
  }
};

showBlockScreen = function(callback) {
  // console.debug("showBlockScreen");
  if ($('#block-screen').length === 0) {
    var blockScreen = $('<div>', {id: 'block-screen'});
    blockScreen.append($('<div>').addClass('sk-spinner sk-spinner-rotating-plane'));
    $('body').append(blockScreen);
  }
  if (callback)
    callback();
};

removeBlockScreen = function(callback) {
  // console.debug("removeBlockScreen");
  $('#block-screen').remove();
  if (callback)
    callback();
};

// add auth info after logged in
configureCertifiedAPI = function(email, authKey) {
    var keys = Object.keys(restResource);
    var params = {
        "email": email,
        "authKey": authKey
    };

    $.each(keys, function(idx, row) {
        restResource[row].addCommonHeader(params);
    });
};

runTimerForSetLastMsgId = function(topic, chatId) {
    console.info("runTimerForSetLastMsgId topic %s, chatId %s", topic, chatId);
    clearTimeout(timerListForLastMsg[topic]); // 기존 timer 삭제 후 초기화
    timerListForLastMsg[topic] = setTimeout(function() {
        shareLastMsgId(topic, chatId);
    }, constants.LAST_MST_ID_TIMER_INTERVAL);
};

shareLastMsgId = function(topic, chatId) {
  console.info("shareLastMsgId topic %s, chatId %s", topic, chatId);
  if (chatId) {
    var params = {
        lastMsgId: chatId,
        topic: topic,
        emplId: loginInfo.emplId
    };
    restResource.chat.updateLastMsg(params);
    myMessage.setLastReadMessageId(topic, chatId);
    chatModule.sendLastMsgId(topic, chatId);
  }

  delete timerListForLastMsg[topic]; //
};

handleLastMsgId = function(payload) {
  // console.info("handleLastMsgId payload %s", JSON.stringify(payload));

  // 멀티 로그인을 고려하여 같은 기종의 alarm count를 초기화 하기 위해서 필요
  if (loginInfo.emplId === payload.senderId) {
    var localLastMstId = myMessage.getLastReadMessageId(payload.topic);
    if (localLastMstId && localLastMstId < payload.lastMsgId) {
        myMessage.setLastReadMessageId(payload.topic, payload.lastMsgId);
        hideChattingAlarm(payload.topic);
    }
  }
};

handleCommand = function(receiver, commandPayload) {
  console.info("handleCommand information %s, %s", receiver, commandPayload.toString());

  if (receiver != loginInfo.emplId) {
    console.error("receiver not match %s, %s", receiver, loginInfo.emplId);
    return;
  }

  switch (commandPayload.type) {
    // channel 관련
    case constants.CHANNEL_CREATE:
      chatModule.subscribe(getChannelTopicName(commandPayload.topic)); // channel 가입

      if (commandPayload.senderId === loginInfo.emplId) {
          chatModule.sendMsg(commandPayload.topic, "Join Channel"); // 가입 message 전송
      }
      displayCreatedChannel(commandPayload);
      break;
    case constants.CHANNEL_ADD_MEMBER:
      reloadChannelCache(commandPayload.channelId);

      // Active 채팅방과 멤버 추가되는 channel이 동일 할경우 asidesection에 member 추가
      if (activeChatInfo && activeChatInfo.channelId === commandPayload.channelId) {
          displayChannelMember(commandPayload.newMembers);
      }
      break;
    case constants.CHANNEL_REMOVE_MEMBER:
      reloadChannelCache(commandPayload.channelId);
      chatModule.unsubscribe(getChannelTopicName(commandPayload.topic)); // channel 가입해지
      if (loginInfo.emplId === commandPayload.member) {
        // 화면 닫기 & 리스트제거
        hideInformationArea();
        hideChatArea();
        // hideScreenShareArea();
        removeChannel(commandPayload.channelId);
      } else {
        if (activeChatInfo && activeChatInfo.channelId === commandPayload.channelId) {
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

loadAllArea = function() {
  loadHtml("/chat/chat_section.html", $("#chat-section"));
  loadHtml("/catalog/catalog_section.html", $("#catalog-section"));
  loadHtml("/header/header_section.html", $("#header-section"));
  // loadHtml("/screenshare/screenshare-section.html", $("#screenshare-section"));
  loadHtml("/call/call_section.html", $("#call-section"));
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

showInformationArea = function(fileName, sendingData) {
  if (isShowInfoSection) {
    $("#information-section").html("");
    loadHtml("/information/" + fileName, $("#information-section"), sendingData);
    $("#information-section").show();
    $("#information-section").delegate('.aside-close-link', 'click touchend', function() {
      isShowInfoSection = false;
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
  // TODO 기존에 압축되어 있지 않은 LocalStorage 삭제 처리 (안정화 후 아래 코드 삭제 처리 한다.)
  for (var sKey in localStorage) {
    if (sKey.startsWith("CHAT")) {
      if (localStorage.getItem(sKey).substring(0,1) === "[") {
        localStorage.clear();
        break;
      }
    }
  }
  initialize();
});
