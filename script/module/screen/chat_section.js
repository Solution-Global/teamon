'use strict';

var constants = require("../constants");

var chatSection = (function() {
  const MESSAGE_TYPE_APPEND = 1;
  const MESSAGE_TYPE_PREPEND = 2;

  var myPref;
  var activeChatInfo;
  var connSection;
  var asideSection;
  var headerSection;
  var chatModule = require('../chat_client');

  // cache DOM
  var $chatSec;
  var $contentArea;
  var $mcsbContainer;
  var $inputText;
  var $btnSend;
  var msgTemplate;
  var dateLineTemplate;

  function _initialize(pref, connSec, asideSec, headerSec) {
    myPref = pref;
    connSection = connSec;
    asideSection = asideSec;
    headerSection = headerSec;

    $chatSec = $(".chat_section");
    $contentArea = $chatSec.find('.content_area');
    $mcsbContainer = $contentArea.find('.mCSB_container');
    $inputText = $chatSec.find('.message-input');
    $btnSend = $chatSec.find('.btn_send');
    msgTemplate = $contentArea.find('#msg-template').html();
    dateLineTemplate = $contentArea.find('#dateline-template').html();

    // bind events
    $btnSend.on('click', sendMsg);
    $inputText.on('keyup', _keyup);
  }

  function sendMsg(msg) {
    if (typeof msg !== "string") {
      msg = $inputText.val();
    }
    if (!msg || !msg.trim().length) {
      return;
    }
    msg = msg.replace(/\n$/, "");
    if (activeChatInfo === undefined) {
      console.error("No peer selected!");
      return;
    }

    chatModule.sendMsg(activeChatInfo.chatType, activeChatInfo.chatRoomId, msg);
    $inputText.val('').focus();
  }

  function _keyup(event) {
    if (event.keyCode == 13 && event.shiftKey !== true) {
      $btnSend.click();
    }
  }

  function recvMsg(myId, topic, payloadStr) {
    var topicArray = topic.split('/');
    if (topicArray.length < 2) {
      console.error("Invalid topic format[%s], payload:%s", topic, payloadStr);
      return;
    }

    var topicType = "/" + topicArray[1];
    if (topicType === constants.TOPIC_MSG) {
      _handleMsg(myId, payloadStr);
    } else if (topicType === constants.TOPIC_PRESENCE) {
      _handlePresence(topic, payloadStr);
    } else {
      console.error("Invalid topic format[%s], payload:", topic, payloadStr);
    }
  }

  function _displayMessages(type, value) {
    var messageTags = $mcsbContainer.find(".chat-message");
    if(Array.isArray(value)) {
      if(MESSAGE_TYPE_APPEND === type) {
        for (var key = 0; key < value.length; key++) {
          if(value[key - 1] && value[key - 1].date != value[key].date) {
            $mcsbContainer.append(Mustache.render(dateLineTemplate, _getDateLineJsonForm(value[key].date)));
          }

          $mcsbContainer.append(Mustache.render(msgTemplate, _getMsgJsonForm(value[key])));
        }
        $contentArea.mCustomScrollbar("scrollTo", "bottom");
      } else {
        // prepend mode
        var firstDate = messageTags ? messageTags.first().data("date") : undefined;
        for (var key = (value.length-1); key > -1; key--) {
          $mcsbContainer.prepend(Mustache.render(msgTemplate, _getMsgJsonForm(value[key])));

          if (key === (value.length-1)) {
            if(firstDate && value[key].date != firstDate) {
              $mcsbContainer.prepend(Mustache.render(dateLineTemplate, _getDateLineJsonForm(firstDate)));
            }
          } else {
            if(value[key - 1] && value[key - 1].date != value[key].date) {
              $mcsbContainer.prepend(Mustache.render(dateLineTemplate, _getDateLineJsonForm(value[key].date)));
            }
          }
        }
      }
    } else {
      if(MESSAGE_TYPE_APPEND === type) {
        var lastDate = messageTags ? messageTags.last().data("date"): undefined;
        if(lastDate && value.date != lastDate) {
          $mcsbContainer.append(Mustache.render(dateLineTemplate, _getDateLineJsonForm(value.date)));
        }
        $mcsbContainer.append(Mustache.render(msgTemplate, _getMsgJsonForm(value)));
        $contentArea.mCustomScrollbar("scrollTo", "bottom");
      }
    }
  }

  function _getMsgJsonForm(message) {
    // Mustache 사용하기 때문에 {msg : []} format을 유지 한다.
    return {"msg" : [message]};
  }
  function _getDateLineJsonForm(date) {
    return {"dateline" : [{"date" : date}]};
  }

  function _handleMsg(myId, payloadStr) {
    console.log("_handleMsg-" + payloadStr);
    /*
      msgPayload = {
        chatType:  // 채팅 타입 (client 담당)
        coid:      // company id (client 담당)
        publisher: // 메시지 발신자 (client 담당)
        receiver:  // 메시지 수신자, direct인 경우 peer id, group인 경우 group chat id (client 담당)
        lastmsgid: // 이전 마지막 msg id. (pubreq 담당)
        msgid:     // DB 저장될 msg id. (pubreq 담당)
        time:      // 메시지 발신 시간 (pubreq 담당)
        msg:       // 발신 메시지 (client 담당)
      }
    */
    var msgPayload = JSON.parse(payloadStr);
    var lastmsgid = parseInt(msgPayload.lastmsgid);
    var sendMode = myId === msgPayload.publisher;

    //{"chatType":1,"coid":1,"publisher":2,"lastmsgid":253,"msgid":254,"time":1454494285376,"msg":"1"}

    // todo lastmsgid와 locallast 값을 비교하여 처리 (현재는 locallast값이 lastmsgid와 동일하다고 가정)
    var locallast = lastmsgid;
    if (locallast < lastmsgid) {
      // api 호출을 통해 모든 누락된 메시지 가져와서 보여주기
    } else {
      // if (!sendMode) {
      //   // target 설정에 따른 chat view 변경이 있는 경우 먼저 처리 후 메시지 출력
      //   connSection.setCurrentTargetUser(msgPayload.publisher, false);
      // }

      var userObj = connSection.getUserObj(msgPayload.publisher);
      var params = {
        spkrId : msgPayload.publisher,
        chatId : msgPayload.msgid,
        msg : msgPayload.msg,
        publisherLoginId : (userObj !== null) ? userObj.loginId : "Unknown[" + msgPayload.publisher + "]",
        creTime : msgPayload.time
      };

      var message = messageManager.madeMessageUnit(params);

      /*
        * 화면 display 조건
        group 일 때 ?
        - receiver가 active chatRoomId 동일 해야함
        direct 일 때?
        - receiver나 publisher가  active chatRoomId 동일 해야함
      */
      if(activeChatInfo.chatType === msgPayload.chatType && (activeChatInfo.chatRoomId  === msgPayload.publisher || activeChatInfo.chatRoomId === msgPayload.receiver)) {
        _displayMessages(MESSAGE_TYPE_APPEND, message);
        $contentArea.mCustomScrollbar("scrollTo", "bottom");
      } else {
        connSection.setAlarmCnt(msgPayload.chatType, msgPayload.chatType === constants.DIRECT_CHAT ? msgPayload.publisher : msgPayload.receiver);
      }

      // Store messages
      var chatRoomId;
      if(msgPayload.chatType === constants.DIRECT_CHAT)
      {
        chatRoomId = sendMode ?  msgPayload.receiver : msgPayload.publisher;
      } else {
        chatRoomId = msgPayload.receiver;
      }

      messageManager.appendChatMessage(message, activeChatInfo.chatType, chatRoomId);
    }
  }

  function _handlePresence(topic, payloadStr) {
    // todo : display presence info
    console.info("topic[%s], payload:", topic, payloadStr);
  }

  function initChatSection(pref, connSec, asideSec, headerSec) {
    _initialize(pref, connSec, asideSec, headerSec);

    var coId = myPref.coId;
    var emplId = myPref.emplId;
    var loginId = myPref.loginId;

    console.log("initChatSection[coId:%s, emplId:%s, loginId:%s]", coId, emplId, loginId);

    chatModule.configMyInfo(coId, emplId, loginId, recvMsg);
  }

  function changeChatView(chatType, chatRoomId, chatRoomName) {
    console.log("chatType:%s, chatRoomId:%s, loginId:%s",chatType, chatRoomId, chatRoomName);

    activeChatInfo = {
      "chatType" : chatType,
      "chatRoomId" : chatRoomId
    };

    // remove chatting texts
    $.each($contentArea.find(".chat-message"), function(idx, row) {
      $(row).remove();
    });
    $.each($contentArea.find(".date_line"), function(idx, row) {
      $(row).remove();
    });

    connSection.hideAlram(chatType, chatRoomId); // init Alram
    headerSection.setTitle(chatRoomName);

    var messageArray = messageManager.getAllChatMessage(activeChatInfo.chatType, activeChatInfo.chatRoomId); // get previous messages
    if(messageArray) {
      _displayMessages(MESSAGE_TYPE_APPEND, messageArray);
    }
  }

  function getPreviousMessage() {
    messageManager.getPreviousChatMessage(activeChatInfo.chatType, activeChatInfo.chatRoomId, function(messageArray) {
      _displayMessages(MESSAGE_TYPE_PREPEND, messageArray);
    });
  }

  function finalize() {
    chatModule.finalize();
  }

  return {
    sendMsg: sendMsg,
    recvMsg: recvMsg,
    initChatSection: initChatSection,
    changeChatView: changeChatView,
    finalize: finalize,
    getPreviousMessage: getPreviousMessage
  };
})();

module.exports = chatSection;
