'use strict';

var Cache = require('../cache');

var catalogSection = (function() {
  // cache DOM
  var $catalogSec;
  var $userArea;
  var $channelArea;
  var $userListContext;
  var $channelListContext;
  var userTemplate;
  var channeTemplate;

  var userCache = new Cache();
  var channelCache = new Cache();

  function _initialize() {
    // 초기화
    myMessage = messageManager(storageManager, myPref, userCache, channelCache);

    $catalogSec = $("#catalog-section");
    $userArea = $catalogSec.find('.chat-users');
    $channelArea = $catalogSec.find('.chat-channels');
    $userListContext = $userArea.find('.users-list');
    $channelListContext = $channelArea.find('.channels-list');
    userTemplate = $userListContext.find('#user-template').html();
    channeTemplate = $channelListContext.find('#channel-template').html();

    $('#onChannelJoinModal').bind("click", function() {
      openModalDialog("./html/catalog/popup/channel_join_popup.html");
    });

    $('#onLoginModal').bind("click", function() {
      var dialogOptions = {
        backdrop : "static",
        keyboard : "false",
        backgroundOpacity : 1,
        backgroundColor : "#2f4050"
      };
      openModalDialog("./html/login_popup.html", dialogOptions);
    });

    _initUsers();
    _initChannels();
    _initEventForChattingList();
 }

 function _initEventForChattingList() {
    // set event for direct chatting
    $userListContext.delegate("li", "click", function() {
      $channelListContext.find("li.active").removeClass("active");
      $userListContext.find("li.active").removeClass("active");
      var $targetList = $(this);
      $targetList.addClass("active");
      activeChatInfo = {
        "chatType" : constants.DIRECT_CHAT,
        "chatRoomId" : $targetList.data("emplid")
      };


      myPreference.setPreference("lastChatInfo", JSON.stringify(activeChatInfo)); // 마지막으로 Active한 chatting 정보 저장
      chatSection.changeChatView(constants.DIRECT_CHAT, $targetList.data("emplid"), $targetList.data("loginid"));

      callSection.hideSection();
      screenshareSection.hideSection();

      adjustSectionSize(informationSection.getSection(), 3);
      adjustSectionSize(chatSection.getSection(), 9);

      chatSection.showSection();
      informationSection.showAboutUser();
    });

    // set event for group chatting
    $channelListContext.delegate("li", "click", function() {
      $channelListContext.find("li.active").removeClass("active");
      $userListContext.find("li.active").removeClass("active");
      var $targetList = $(this);
      $targetList.addClass("active");
      activeChatInfo = {
        "chatType" : constants.GROUP_CHAT,
        "chatRoomId" : $targetList.data("channelid")
      };
      myPreference.setPreference("lastChatInfo", JSON.stringify(activeChatInfo)); // 마지막으로 Active한 chatting 정보 저장
      chatSection.changeChatView(constants.GROUP_CHAT, $targetList.data("channelid"), $targetList.data("name"));

      callSection.hideSection();
      screenshareSection.hideSection();

      adjustSectionSize(informationSection.getSection(), 3);
      adjustSectionSize(chatSection.getSection(), 9);

      chatSection.showSection();
      informationSection.showAboutChannel();
    });
  }

  function displayChannel(params) {
    var channelData = {
      "channelId": params.channelId,
      "name": params.name
    };
    $channelListContext.prepend(Mustache.render(channeTemplate, channelData));

    reloadChannelCache(params.channelId);
  }

  function displayChannel(params) {
    var channelData = {
      "channelId": params.channelId,
      "name": params.name
    };
    $channelListContext.prepend(Mustache.render(channeTemplate, channelData));

    reloadChannelCache(params.channelId);
  }

  function removeChannel(channelId) {
    $channelListContext.find("[data-channelid='" + channelId + "']").remove();
    reloadChannelCache(channelId);
  }

  function reloadChannelCache(channelId) {
    var params = {
      "channelId": channelId,
      "memberIncluded": true
    };

    restResourse.channel.getChannel(params, function(data, response) {
      if(response.statusCode === 200) {
        if(data.channelId) {
          channelCache.set(channelId, data);
        }
      } else {
        console.error("fail channel reload!!");
      }
    });
  }

  function initCatalogSection() {
    _initialize();
  }

  function resizeCatalogSection() {
    var windowHeight = $(window).height();
    var catalogHeaderHeight = $catalogSec.find(".nav-header").outerHeight(true);
    var catalogChannelsHeight = $catalogSec.find(".channels-link").outerHeight(true);
    var catalogUsersHeight = $catalogSec.find(".users-link").outerHeight(true);

    // 마지막의 3,2,1 오차 pixel.
    var scrollHeight = windowHeight - catalogHeaderHeight - catalogChannelsHeight - catalogUsersHeight - 3;

    $channelArea.css("height", scrollHeight * 0.3 );
    $userArea.css("height", scrollHeight * 0.7 );
  }

  function loadCatalogSection() {
    loadHtml("./html/catalog/catalog_section.html", $("#catalog-section"));
  }

  function _initChannels() {
    console.log("call initChannels[coId:%s]", coId);
    var coId = myPref.coId;
    var params = {
      "coId": coId,
      "memberIncluded": true
    };

    restResourse.channel.getChannelList(params, function(data) {
      if(data) {
        $.each(data, function(idx, row) {
          var members;
          var isIncludingMember = false;
          for(var key in row.memberList) {
            var member = row.memberList[key];

            if(!isIncludingMember && myPref.emplId === member.emplId) {
              isIncludingMember = true;
            }

            if(members) {
              members += "," + member.emplId;
            } else {
              members =  member.emplId;
            }
          }
          // 본인이 속한 channel list 표시
          if(!isIncludingMember)
            return;

          channelCache.set(row.channelId, row); // add each employee into channelCache.

          var channelData = {
              "channelId": row.channelId,
              "name": row.name,
          };
          $channelListContext.prepend(Mustache.render(channeTemplate, channelData));
        });

        _activeChatView(constants.GROUP_CHAT);
      }

      // init scroll
      var scrollHeight = $(window).height() - 230;
      $channelArea.mCustomScrollbar({
        axis:"y",
        setWidth: "auto",
        setHeight:  scrollHeight * 0.3,
        theme:"3d",
      });

      //sync Message
      myMessage.syncChatMessage(constants.GROUP_CHAT);

    });
  }

  function _initUsers() {
    console.log("call initUsers[coId:%s]", coId);
    var coId = myPref.coId;
    var params = {
      "coId": coId,
      "limit" : constants.COMMON_SEARCH_ALL
    };

    restResourse.empl.getListByCoid(params, function(data) {
      if (data.rows) {
        $.each(data.rows, function(idx, row) {
          userCache.set(row.emplId, row); // add each employee into userCache.
          console.log(row);
          if (row.emplId === myPref.emplId)
            return;

          // img file (TODO 이후 사용자 이미지를 서버에 저장할 경우 photoLoc 정보를 이용하여 서버에서 가져와 로컬에 저장)
          var imgIdx = row.emplId % 10;
          var imgFile = "file://" + path.join(__dirname, '../../../img/profile_img' + imgIdx + '.jpg');
          var userData = {
              "emplId": row.emplId,
              "loginId": row.loginId,
              "img": imgFile,
              "imgAlt": row.name
          };
          $userListContext.append(Mustache.render(userTemplate, userData));
        });

        _activeChatView(constants.DIRECT_CHAT);
      }

      // init scroll
      var scrollHeight = $(window).height() - 230;
      $userArea.mCustomScrollbar({
        axis:"y",
        setWidth: "auto",
        setHeight:  scrollHeight * 0.7,
        theme:"3d"
      });

      //sync Message
      myMessage.syncChatMessage(constants.DIRECT_CHAT);
    });
  }

  function _activeChatView(chatType) {
    var lastChatInfo = myPreference.getPreference("lastChatInfo");
    if(lastChatInfo) {
      lastChatInfo = JSON.parse(lastChatInfo);
      if(chatType === lastChatInfo.chatType) {
        var $activeTarget = _getActiveTarget(lastChatInfo.chatType, lastChatInfo.chatRoomId);
        $activeTarget.trigger("click");
      }
    } else {
      // 마지막으로 저장된 chatting 정보가 없을 경우
      informationSection.hideSection();
      chatSection.hideSection();
      callSection.hideSection();
      screenshareSection.hideSection();
    }
  }

  function _getActiveTarget(chatType, chatId) {
    var $activeTarget;
    if (chatType === constants.DIRECT_CHAT)
      $activeTarget = $userListContext.find("[data-emplid='" + chatId + "']");
    else
      $activeTarget = $channelListContext.find("[data-channelid='" + chatId + "']");

    return $activeTarget;
  }

  function hideAlram(chatType, chatId) {
    var $activeTarget = _getActiveTarget(chatType, chatId);
    var alarmArea = $activeTarget.find(".alarm");
    alarmArea.addClass("hide");
    alarmArea.html("");
  }

  function setAlarmCnt(chatType, chatId) {
    var $activeTarget = _getActiveTarget(chatType, chatId);

    var alarmArea = $activeTarget.find(".alarm");
    var cnt = alarmArea.text();
    alarmArea.html(cnt ? Number(cnt) + 1 : "1");
    alarmArea.removeClass("hide");
  }

  function getUserObj(emplId) {
    return userCache.get(emplId);
  }

  function getChannelObj(channelId) {
    return channelCache.get(channelId);
  }

  function getUsers() {
    return userCache.getValueArray();
  }

  function reloadSection() {
    // 초기화
    myMessage = messageManager(storageManager, myPref, userCache, channelCache);

    $userListContext.find("li").remove();
    userCache.initCache();

    $channelListContext.find("li").remove();
    channelCache.initCache();

    _initUsers();
    _initChannels();
  }

  return {
    initCatalogSection: initCatalogSection,
    resizeCatalogSection: resizeCatalogSection,
    loadCatalogSection: loadCatalogSection,
    hideAlram:hideAlram,
    setAlarmCnt: setAlarmCnt,
    getUserObj: getUserObj,
    getChannelObj: getChannelObj,
    getUsers: getUsers,
    displayChannel: displayChannel,
    removeChannel: removeChannel,
    reloadChannelCache: reloadChannelCache,
    reloadSection: reloadSection
  };
})();

module.exports = catalogSection;
