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
    var peer = connSection.getCurrentChattingTarget();

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

  function recvMsg(myId, msgInfo) {
    var sendMode = myId === msgInfo.publisher;
    var topic = msgInfo.topic;
    var message = msgInfo.payload.toString();
    var sender = "have to change";

    console.log("[sendMode]" + sendMode);
    console.log("[topic]" + topic);
    console.log("[message]" + message);
    console.log("[sender]" + sender);

    // img file (TODO 이후 사용자 이미지를 서버에 저장할 경우 photoLoc 정보를 이용하여 서버에서 가져와 로컬에 저장)
    var imgIdx = (msgInfo.publisher * 1) % 10;
    var recvData = {
      "msg": [{
        "mode": sendMode ? "send" : "receive", // send or receive
        "img": "../img/profile_img" + imgIdx + ".jpg",
        "imgAlt": sender,
        "sender": sender,
        "msgText": message + ' from ' + topic,
        "time": new Date().format("a/p hh mm")
      }]
    };

    $mcsbContainer.append(Mustache.render(msgTemplate, recvData));
    $contentArea.mCustomScrollbar("scrollTo", "bottom");

    db.serialize(function() {
      var insertMsg = recvData.msg[0];
      var stmt = db.prepare("INSERT INTO message VALUES (?, ?, ?, ?, ?, ?, ?)");
      stmt.run(topic, insertMsg.mode, insertMsg.img, insertMsg.imgAlt, insertMsg.sender, insertMsg.msgText, insertMsg.time);
      stmt.finalize();
    });
  }

  function initChatSection(pref, chatMo, connSec) {
    _initialize(pref, chatMo, connSec);

    var coId = myPref.login.coId;
    var emplId = myPref.login.emplId;
    var loginId = myPref.login.loginId;

    console.log("initChatSection[coId:%s, emplId:%s, loginId:%s]", coId, emplId, loginId);

    chatModule.configMyInfo(coId, emplId, loginId, recvMsg);
  }

  function changeChatView(chatId, title) {
    console.log("chatId:%s, title:%s", chatId, title);

    activeTopic = chatModule.getTopic(0, chatId) + "/2";
    $title.html(title);
    $.each($contentArea.find(".msg_set"), function(idx, row) {
      $(row).remove(); // remove chatting texts
    });

    //read chatting message
    db.serialize(function() {
      db.each("SELECT * FROM message WHERE topic=?", activeTopic , function(err, row) {
          $mcsbContainer.append(Mustache.render(msgTemplate, {
            "msg": [row]
          }));
        });
    });
  }

  return {
    sendMsg: sendMsg,
    recvMsg: recvMsg,
    initChatSection: initChatSection,
    changeChatView: changeChatView
  };
})();

module.exports = chatSection;
