'use strict';

var constants = require("../constants");

var chatSection = (function() {
  var myPref;
  var connSection;
  var activeChatId;
  var activeChatType;
  var asideSection;
  var chatModule = require('../chat');

  // cache DOM
  var $chatSec;
  var $titleArea;
  var $title;
  var $contentArea;
  var $mcsbContainer;
  var $inputMsg;
  var $inputText;
  var $btnSend;
  var msgTemplate;

  function _initialize(pref, connSec, asideSec) {
    myPref = pref;
    connSection = connSec;
    asideSection = asideSec;

    $chatSec = $(".chat_section");
    $titleArea = $chatSec.find(".title_area");
    $title = $titleArea.find(".tit");
    $contentArea = $chatSec.find('.content_area');
    $mcsbContainer = $contentArea.find('.mCSB_container');
    $inputMsg = $chatSec.find('.input_message');
    $inputText = $inputMsg.find('.input_text');
    $btnSend = $inputMsg.find('.btn_send');
    msgTemplate = $contentArea.find('#msg-template').html();

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
    var peer = connSection.getCurrentTargetUser();
    if (peer === undefined) {
      console.error("No peer selected!");
      return;
    }

    chatModule.sendDirectMsg(peer, msg);
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

  function _handleMsg(myId, payloadStr) {
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
    var message = msgPayload.msg.toString();
    var userObj = connSection.getUserObj(msgPayload.publisher);
    var sender = (userObj !== null) ? userObj.loginId : "Unknown[" + msgPayload.publisher + "]";
    var sendMode = myId === msgPayload.publisher;

    // todo lastmsgid와 locallast 값을 비교하여 처리 (현재는 locallast값이 lastmsgid와 동일하다고 가정)
    var locallast = lastmsgid;
    if (locallast < lastmsgid) {
      // api 호출을 통해 모든 누락된 메시지 가져와서 보여주기
    } else {
      if (!sendMode) {
        // target 설정에 따른 chat view 변경이 있는 경우 먼저 처리 후 메시지 출력
        connSection.setCurrentTargetUser(msgPayload.publisher, false);
      }

      if(myId === msgPayload.publisher || myId === msgPayload.receiver ) {
        // img file (TODO 이후 사용자 이미지를 서버에 저장할 경우 photoLoc 정보를 이용하여 서버에서 가져와 로컬에 저장)
        var imgIdx = (msgPayload.publisher * 1) % 10;
        var recvData = {
          "msg": [{
            "msgId": msgPayload.msgid,
            "mode": sendMode ? "send" : "receive", // send or receive
            "img": "../img/profile_img" + imgIdx + ".jpg",
            "imgAlt": sender,
            "sender": sender,
            "msgText": message,
            "time": new Date(msgPayload.time).format("a/p hh mm")
          }]
        };

        if(activeChatType === msgPayload.chatType && (activeChatId  === msgPayload.publisher || activeChatId === msgPayload.receiver)) {
          $mcsbContainer.append(Mustache.render(msgTemplate, recvData));
          $contentArea.mCustomScrollbar("scrollTo", "bottom");
        } else {
          connSection.setAlarmCnt(msgPayload.publisher);
        }

        // Store Resource
        temonStrorage.appendChatMessage(recvData.msg[0], activeChatType, (sendMode ?  msgPayload.receiver : msgPayload.publisher));

      } else {
        // 로그인한 사용자의 chatting 이 아니라 무시
      }
     }
  }

  function _handlePresence(topic, payloadStr) {
    // todo : display presence info
    console.info("topic[%s], payload:", topic, payloadStr);
  }

  function initChatSection(pref, connSec, asideSec) {
    _initialize(pref, connSec, asideSec);

    var coId = myPref.coId;
    var emplId = myPref.emplId;
    var loginId = myPref.loginId;

    console.log("initChatSection[coId:%s, emplId:%s, loginId:%s]", coId, emplId, loginId);

    chatModule.configMyInfo(coId, emplId, loginId, recvMsg);
  }

  function changeChatView(chatType, chatId, title) {
    console.log("chatType:%s, chatId:%s, title:%s",chatType, chatId, title);
    activeChatId = chatId;
    activeChatType = chatType;

    $title.html(title);
    $.each($contentArea.find(".msg_set"), function(idx, row) {
      $(row).remove(); // remove chatting texts
    });

    connSection.hideAlram(chatId); // init Alram

    var messageArray = temonStrorage.getChatMessage(activeChatType, activeChatId);
    if(messageArray) {
      $mcsbContainer.append(Mustache.render(msgTemplate, messageArray));
      $contentArea.mCustomScrollbar("scrollTo", "bottom");
    }
  }

  function finalize() {
    chatModule.finalize();
  }

  return {
    sendMsg: sendMsg,
    recvMsg: recvMsg,
    initChatSection: initChatSection,
    changeChatView: changeChatView,
    finalize: finalize
  };
})();

module.exports = chatSection;
