'use strict';

var Cache = require('../cache');
var constants = require("../constants");

var connSection = (function() {
  var myPref;
  var chatModule;
  var chatSection;

  // cache DOM
  var $connSec;
  var $userListContext;
  var userTemplate;

  var userCache = new Cache();

  function _initialize(pref, chatMo, chatSec) {
    myPref = pref;
    chatModule = chatMo;
    chatSection = chatSec;

    $connSec = $(".connection_section");
    $userListContext = $connSec.find('.users_area .list');
    userTemplate = $userListContext.find('#user-template').html();

    // set event for direct chatting
    $userListContext.delegate("li", "click", function() {
      $userListContext.find("li.active").removeClass("active");
      var $targetList = $(this);
      $targetList.addClass("active");
      chatSection.changeChatView(constants.DIRECT_CHAT, $targetList.data("emplid"), $targetList.data("loginid"));
    });
  }

  function initConnSection(pref, chatMo, chatSec) {
    _initialize(pref, chatMo, chatSec);
    _initEmployees();
  }

  function _initEmployees() {
    var coId = myPref.coId;
    console.log("call _initEmployees[coId:%s]", coId);

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
            "user": [{
              "emplId": row.emplId,
              "loginId": row.loginId,
              "img": imgFile,
              "imgAlt": row.name
            }]
          };
          $userListContext.append(Mustache.render(userTemplate, userData));

          // init msg
          // var params = {
          //   "peer1": Math.min.apply(null, [myPref.emplId, row.emplId]),
          //   "peer2": Math.max.apply(null, [myPref.emplId, row.emplId])
          // };
          //
          // var lastMsgId = temonStrorage.getChatLastMessageId(constants.DIRECT_CHAT, row.emplId);
          // if(lastMsgId) {
          //   params.lastMsgId = lastMsgId;
          // }
          //
          // restResourse.chat.getListByPeers(params, function(data) {
          //   if (data) {
          //     $.each(data, function(idx, msgRow) {
          //       var sendMode =  myPref.emplId === msgRow.spkrId;
          //       var sender = sendMode ? myPref.loginId : row.loginId;
          //       var imgIdx = (msgRow.spkrId * 1) % 10;
          //
          //       var msgData = {
          //           "msgId": msgRow.dcid,
          //           "mode": sendMode ? "send" : "receive", // send or receive
          //           "img": "../img/profile_img" + imgIdx + ".jpg",
          //           "imgAlt": sender,
          //           "sender": sender,
          //           "msgText": msgRow.msg,
          //           "time": new Date(msgRow.creTime).format("a/p hh mm")
          //       };
          //
          //       temonStrorage.appendChatMessage(msgData, constants.DIRECT_CHAT, row.emplId);
          //     });
          //   }
          // });
        });
      }
    });
  }

  function hideAlram(emplId) {
    var target = $userListContext.find("[data-emplid='" + emplId + "']");
    var alarmArea = target.find(".alarm");
    alarmArea.addClass("hide");
    alarmArea.html("");
  }

  function setAlarmCnt(emplId) {
    var target = $userListContext.find("[data-emplid='" + emplId + "']");
    var alarmArea = target.find(".alarm");
    var cnt = alarmArea.text();
    alarmArea.html(cnt ? Number(cnt) + 1 : "1");
    alarmArea.removeClass("hide");
  }

  function getCurrentTargetUser() {
    var $activeTarget = $userListContext.find('.active');
    if ($activeTarget.length !== 0) {
      return $activeTarget.data("emplid");
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
