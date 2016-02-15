'use strict';

var Cache = require('../cache');

var catalogSection = (function() {
  // cache DOM
  var $catalogSec;
  var $userListContext;
  var $channelListContext;
  var userTemplate;
  var channeTemplate;

  var userCache = new Cache();
  var channelCache = new Cache();

  function _initialize() {
    // 초기화
    messageManager = messageManager(storageManager, myPref, userCache, channelCache);

    $catalogSec = $("#catalog-section");
    $userListContext = $catalogSec.find('.chat-users .users-list');
    $channelListContext = $catalogSec.find('.chat-channels .channels-list');
    userTemplate = $userListContext.find('#user-template').html();
    channeTemplate = $channelListContext.find('#channel-template').html();

    $('#onChannelJoinModal').bind("click", function() {
      openModalDialog("./html/catalog/popup/channel_join_popup.html");
    });

    $('#onLoginModal').bind("click", function() {
      var dialogOptions = {
        backdrop : "static",
        keyboard : "false"
      };
      openModalDialog("./html/login_popup.html", dialogOptions);
    });

    _initEventForChattingList();
    _initCustomScrollbar()
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
      chatSection.changeChatView(constants.DIRECT_CHAT, $targetList.data("emplid"), $targetList.data("loginid"));

      // informationSection.showCallInfo($targetList.data("emplid"), $targetList.data("loginid"));
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
      chatSection.changeChatView(constants.GROUP_CHAT, $targetList.data("channelid"), $targetList.data("name"));
      informationSection.showAboutChannel();
    });
  }

  function displayChannel(params) {
    var channelData = {
      "channelId": params.channelId,
      "name": params.name
    };
    $channelListContext.prepend(Mustache.render(channeTemplate, channelData));

    reloadChannel(params.channelId);
  }

  function displayChannel(params) {
    var channelData = {
      "channelId": params.channelId,
      "name": params.name
    };
    $channelListContext.prepend(Mustache.render(channeTemplate, channelData));

    reloadChannel(params.channelId);
  }

  function hideChannel(channelId) {
    $channelListContext.find("[data-channelid='" + channelId + "']").remove();
    reloadChannel(channelId);
  }

  function reloadChannel(channelId) {
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
    _initUsers();
    _initChannels();
  }

  function _initCustomScrollbar() {
    var scrollHeight = $(window).height() - 230;
    $catalogSec.find('.chat-channels').mCustomScrollbar({
      axis:"y",
      setWidth: "auto",
      setHeight:  scrollHeight * 0.3,
      theme:"3d",
    });

    $catalogSec.find('.chat-users').mCustomScrollbar({
      axis:"y",
      setWidth: "auto",
      setHeight:  scrollHeight * 0.7,
      theme:"3d"
    });
  }

  function resizeCatalogSection() {
    var windowHeight = $(window).height();
    var catalogHeaderHeight = $catalogSec.find(".nav-header").outerHeight(true);
    var catalogChannelsHeight = $catalogSec.find(".channels-link").outerHeight(true);
    var catalogUsersHeight = $catalogSec.find(".users-link").outerHeight(true);

    // 마지막의 3,2,1 오차 pixel.
    var scrollHeight = windowHeight - catalogHeaderHeight - catalogChannelsHeight - catalogUsersHeight - 3;

    $catalogSec.find(".chat-channels").css("height", scrollHeight * 0.3 );
    $catalogSec.find(".chat-users").css("height", scrollHeight * 0.7 );
  }

  function loadCatalogSection() {
    loadHtml("./html/catalog/catalog_section.html", $("#catalog-section"));
  }

  function _initChannels() {
    var coId = myPref.coId;
    console.log("call _initChannels[coId:%s]", coId);

    var params = {
      "coId": coId,
      "memberIncluded": true
    };

    // 초기화
    $channelListContext.find("li").remove();
    channelCache.initCache();

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

        //sync Message
        messageManager.syncChatMessage(constants.GROUP_CHAT);
      }
    });
  }

  function _initUsers() {
    var coId = myPref.coId;
    console.log("call _initUsers[coId:%s]", coId);

    var params = {
      "coId": coId
    };

    restResourse.empl.getListByCoid(params, function(data) {
      if (data.rows) {
        $.each(data.rows, function(idx, row) {
          userCache.set(row.emplId, row); // add each employee into userCache.

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
      }

      //sync Message
      messageManager.syncChatMessage(constants.DIRECT_CHAT);
    });
  }

  function hideAlram(chatType, chatId) {
    var $activeTarget;
    if (chatType === constants.DIRECT_CHAT)
      $activeTarget = $userListContext.find("[data-emplid='" + chatId + "']");
    else
      $activeTarget = $channelListContext.find("[data-channelid='" + chatId + "']");

    var alarmArea = $activeTarget.find(".alarm");
    alarmArea.addClass("hide");
    alarmArea.html("");
  }

  function setAlarmCnt(chatType, chatId) {
    var $activeTarget;
    if (chatType === constants.DIRECT_CHAT)
      $activeTarget = $userListContext.find("[data-emplid='" + chatId + "']");
    else
      $activeTarget = $channelListContext.find("[data-channelid='" + chatId + "']");

    var alarmArea = $activeTarget.find(".alarm");
    var cnt = alarmArea.text();
    alarmArea.html(cnt ? Number(cnt) + 1 : "1");
    alarmArea.removeClass("hide");
  }

  function getCurrentTargetUser(chatType) {
    var $activeTarget;
    if (chatType === constants.DIRECT_CHAT) {
      $activeTarget = $userListContext.find('.active');
      if ($activeTarget.length !== 0) {
        return $activeTarget.data("emplid");
      }
    } else {
      $activeTarget = $channelListContext.find('.active');
      if ($activeTarget.length !== 0) {
        return $activeTarget.data("channelid");
      }
    }

    return undefined;
  }

  function setCurrentTargetUser(peerid, force) {
    force = force || false;

    var findTarget = true;
    if (!force) {
      var $activeTarget = $userListContext.find('.active');
      if ($activeTarget.length !== 0) {
        findTarget = false;
      }
    }

    var $targetPeer;
    if (findTarget) {
      $targetPeer = $userListContext.find('[data-emplid="' + peerid + '"]');
    }

    console.log("peerid:%s, force:%s, findTarget:%b, $targetPeer:%o", peerid, force, findTarget, $targetPeer);

    if ($targetPeer !== undefined)
      $targetPeer.trigger("click");
  }

  function getUserObj(emplId) {
    return userCache.get(emplId);
  }

  function getUsers() {
    return userCache.getValueArray();
  }
  function getChannelObj(channelId) {
    return channelCache.get(channelId);
  }

  return {
    initCatalogSection: initCatalogSection,
    resizeCatalogSection: resizeCatalogSection,
    loadCatalogSection: loadCatalogSection,
    hideAlram:hideAlram,
    setAlarmCnt: setAlarmCnt,
    getCurrentTargetUser: getCurrentTargetUser,
    setCurrentTargetUser: setCurrentTargetUser,
    getUserObj: getUserObj,
    getUsers: getUsers,
    getChannelObj: getChannelObj,
    displayChannel: displayChannel,
    hideChannel: hideChannel,
    reloadChannel: reloadChannel
  };
})();

module.exports = catalogSection;
