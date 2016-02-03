'use strict';

var Cache = require('../cache');
var constants = require("../constants");

var connSection = (function() {
  var myPref;
  var chatSection;
  var asideSection;

  // cache DOM
  var $connSec;
  var $userListContext;
  var $channelListContext;
  var userTemplate;
  var channeTemplate;

  var userCache = new Cache();
  var channelCache = new Cache();

  function _initialize(pref, chatSec, asideSec) {
    myPref = pref;
    chatSection = chatSec;
    asideSection = asideSec;

    // 초기화
    messageManager = messageManager(storageManager, myPref, userCache, channelCache);

    $connSec = $(".connection_section");
    $userListContext = $connSec.find('.chat-users .users-list');
    $channelListContext = $connSec.find('.chat-channels .channels-list');
    userTemplate = $userListContext.find('#user-template').html();
    channeTemplate = $channelListContext.find('#channel-template').html();

    // set event for direct chatting
    $userListContext.delegate("li", "click", function() {
      $channelListContext.find("li.active").removeClass("active");
      $userListContext.find("li.active").removeClass("active");
      var $targetList = $(this);
      $targetList.addClass("active");
      chatSection.changeChatView(constants.DIRECT_CHAT, $targetList.data("emplid"), $targetList.data("loginid"));
      // asideSection.showCallInfo($targetList.data("emplid"), $targetList.data("loginid"));
      asideSection.showAboutUser($targetList.data("emplid"), userCache);
    });

    // set event for group chatting
    $channelListContext.delegate("li", "click", function() {
      $channelListContext.find("li.active").removeClass("active");
      $userListContext.find("li.active").removeClass("active");
      var $targetList = $(this);
      $targetList.addClass("active");
      chatSection.changeChatView(constants.GROUP_CHAT, $targetList.data("channelid"), $targetList.data("name"));
      asideSection.showAboutChannel($targetList.data("channelid"), $targetList.data("members"), userCache, channelCache);
    });

    // set event for channel modal
    $connSec.find(".joinChannel").click(function() {
      var channlJoinModal = $("#channlJoinModal");
      var channelForm = $("#channelForm");
      var userArray = userCache.getValueArray();
      var chosenSelect = channelForm.find(".chosen-select");
      for(var key in userArray) {
        // if (userArray[key].emplId === myPref.emplId)
        //   continue;
        chosenSelect.append("<option value='" + userArray[key].emplId + "'>" + userArray[key].loginId + "</option>");
      }
      chosenSelect.chosen({width:"100%"});

      // set validation for login Form
      channelForm.validate({
        rules: {
          name: {
            required: true,
            minlength: 6
          },
          members: {
            required: true,
            min: 1
          }
        }
      });

      // set event for new create channel
      channlJoinModal.find(".create").click(function() {
        if(!channelForm.valid())
          return;

          var name = channelForm.find("[name=name]");
          var members = channelForm.find("[name=members]");
          var pinupMessage = channelForm.find("[name=pinupMessage]");

          var params = {
            "coId": myPref.coId,
            "name": name.val(),
            "members": members.val(),
            "pinupMessage": pinupMessage.val()
          };

          restResourse.channel.createChannel(params,
            function(response) {
              // Success
              if(response.statusCode === 200) {
                _initChannels();
                channlJoinModal.modal("hide");
              } else {
                console.log("[fail creating channel]" + response.statusMessage);
              }
            }
          );
      });

      channlJoinModal.modal(); // show modal
    });
  }

  function initConnSection(pref, chatSec, asideSec) {
    _initialize(pref, chatSec, asideSec);
    _initUsers();
    _initChannels();
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
              "members": members,
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
      $activeTarget = $channelListContext.find("[data-channel='" + chatId + "']");

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

  function getChannelObj(channelId) {
    return channelCache.get(channelId);
  }

  return {
    initConnSection: initConnSection,
    hideAlram:hideAlram,
    setAlarmCnt: setAlarmCnt,
    getCurrentTargetUser: getCurrentTargetUser,
    setCurrentTargetUser: setCurrentTargetUser,
    getUserObj: getUserObj
  };
})();

module.exports = connSection;
