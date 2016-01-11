'use strict';

var chatSection = (function() {
  var myPref;
  var chatModule;
  var connSection;
  var activeTopic;

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

  function _initialize(pref, chatMo, connSec) {
    myPref = pref;
    chatModule = chatMo;
    connSection = connSec;

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
    } else {
      chatModule.sendDirectMsg(peer, msg);
    }

    $inputText.val('').focus();
  }

  function _keyup(event) {
    if (event.keyCode == 13 && event.shiftKey !== true) {
      $btnSend.click();
    }
  }

  function recvMsg(myId, payloadStr) {
    /*
      msgPayload = {
        chatType:  // 채팅 타입 (client 담당)
        publisher: // 메시지 발신자 (client 담당)
        receiver:  // 메시지 수신자, direct인 경우 peer id, group인 경우 group chat id (client 담당)
        msgid:     // DB 저장될 msg id. (pubreq 담당)
        time:      // 메시지 발신 시간 (pubreq 담당)
        msg:       // 발신 메시지 (client 담당)
      }
    */
    var msgPayload = JSON.parse(payloadStr);
    var message = msgPayload.msg.toString();
    var userObj = connSection.getUserObj(msgPayload.publisher);
    var sender = (userObj !== null) ? userObj.loginId : "Unknown[" + msgPayload.publisher + "]";
    var sendMode = myId === msgPayload.publisher;
    if (!sendMode) {
      // target 설정에 따른 chat view 변경이 있는 경우 먼저 처리 후 메시지 출력
      connSection.setCurrentTargetUser(msgPayload.publisher, false);
    }

    var msgTopic = chatModule.getTopic(msgPayload.chatType, sendMode ? msgPayload.receiver : msgPayload.publisher);

    // img file (TODO 이후 사용자 이미지를 서버에 저장할 경우 photoLoc 정보를 이용하여 서버에서 가져와 로컬에 저장)
    var imgIdx = (msgPayload.publisher * 1) % 10;
    var recvData = {
      "msg": [{
        "mode": sendMode ? "send" : "receive", // send or receive
        "img": "../img/profile_img" + imgIdx + ".jpg",
        "imgAlt": sender,
        "sender": sender,
        "msgText": message,
        "time": new Date(msgPayload.time).format("a/p hh mm")
      }]
    };

    if(activeTopic === msgTopic) {
      $mcsbContainer.append(Mustache.render(msgTemplate, recvData));
      $contentArea.mCustomScrollbar("scrollTo", "bottom");
    } else {
      connSection.setAlarmCnt(msgPayload.publisher);
    }



    // Store Resource
    var resourceName = "CHAT_" +  msgTopic;
    var getMessages = localStorage.getItem(resourceName);
    if(getMessages)
    {
      getMessages += ("," + JSON.stringify(recvData.msg[0]));
    } else {
      getMessages = JSON.stringify(recvData.msg[0]);
    }
    localStorage.setItem(resourceName , LZString.compress(getMessages));
  }

  function initChatSection(pref, chatMo, connSec) {
    _initialize(pref, chatMo, connSec);

    var coId = myPref.login.coId;
    var emplId = myPref.login.emplId;
    var loginId = myPref.login.loginId;

    console.log("initChatSection[coId:%s, emplId:%s, loginId:%s]", coId, emplId, loginId);

    chatModule.configMyInfo(coId, emplId, loginId, recvMsg);
  }

  function changeChatView(chatType, chatId, title) {
    console.log("chatId:%s, title:%s", chatId, title);
    activeTopic = chatModule.getTopic(chatType, chatId);
    $title.html(title);
    $.each($contentArea.find(".msg_set"), function(idx, row) {
      $(row).remove(); // remove chatting texts
    });

    connSection.hideAlram(chatId); // init Alram

    var resourceName = "CHAT_" +  activeTopic;
    var getMessages = localStorage.getItem(resourceName);
    if(getMessages) {
        var st = LZString.decompress(getMessages);
        console.log(st);
        console.log(LZString.decompress(getMessages));
        console.log("---");
        var jsonFormmet = "{\"msg\":[" +  LZString.decompress(getMessages) + "]}";
        var messagesArr  = JSON.parse(jsonFormmet);
        $mcsbContainer.append(Mustache.render(msgTemplate, messagesArr));
    }
  }

  //{messge:[{"chatType":0,"publisher":2,"receiver":1,"msg":"test","time":1452240680971,"msgid":"216"},{"chatType":0,"publisher":1,"receiver":2,"msg":"test","time":1452241536684,"msgid":"217"},{"chatType":0,"publisher":1,"receiver":2,"msg":"test","time":1452241538709,"msgid":"218"}]}

  return {
    sendMsg: sendMsg,
    recvMsg: recvMsg,
    initChatSection: initChatSection,
    changeChatView: changeChatView
  };
})();

module.exports = chatSection;
