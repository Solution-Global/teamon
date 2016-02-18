'use strict';

var chatSection = (function() {
  const MESSAGE_TYPE_APPEND = 1;
  const MESSAGE_TYPE_PREPEND = 2;

  // cache DOM
  var $chatSec;
  var $contentArea;
  var $mcsbContainer;
  var $inputText;
  var $btnSend;
  var msgTemplate;
  var dateLineTemplate;
  var $mentionText;

  function _initialize() {
    $chatSec = $("#chat-section");
    $contentArea = $chatSec.find('.content_area');
    $inputText = $chatSec.find('.message-input');
    $btnSend = $chatSec.find('.btn_send');
    msgTemplate = $('#msg-template').html();
    dateLineTemplate = $('#dateline-template').html();

    // bind events
    $btnSend.on('click', sendMsg);
    $inputText.on('keyup', _keyupInputText);

    $mentionText = $inputText.mention({
      users : [],
      queryBy : ['username'],
    });

     _initCustomScrollbar()
     $mcsbContainer = $contentArea.find('.mCSB_container'); // set this value after _initCustomScrollbar

     $("#fileupload-btn").click(function() {
       openModalDialog("./html/chat/fileupload_pop.html");
     });

     $("#capture-btn").click(function() {
       openModalDialog("./html/chat/capture_pop.html");
     });

  }

  function _initCustomScrollbar() {
    $contentArea.mCustomScrollbar({
      axis:"y",
      setWidth: "auto",
      theme:"3d",
      callbacks:{
        onScroll:function(){
          if(this.mcs.top === 0) {
            chatSection.getPreviousMessage(this.mcs.draggerTop);
          }
        }
      },
      scrollInertia : 0
    }).mCustomScrollbar("scrollTo", "bottom");
  }

  function _lastChatRoom() {
    storageManager.setValue("remeberEmplId", data.emplId);
  }

  function sendMsg(msg, chatType, chatRoomId) {
    if (typeof msg !== "string") {
      msg = $inputText.val();
    }
    if (!msg || !msg.trim().length) {
      return;
    }
    msg = msg.replace(/\n$/, "");
    if (chatType === undefined && chatRoomId === undefined && activeChatInfo === undefined) {
      console.error("No peer selected!");
      return;
    }

    chatType = chatType || activeChatInfo.chatType;
    chatRoomId = chatRoomId || activeChatInfo.chatRoomId;

    chatModule.sendMsg(chatType, chatRoomId, msg);

    $inputText.val("").focus();
  }

  function _keyupInputText(event) {
    // mention이 활성화 되어 있으면 send 전송을 막는다.
    if (event.keyCode == 13 && event.shiftKey !== true && !$mentionText.data('mention').shown) {
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
    } else if (topicType === constants.TOPIC_COMMAND) {
      _handleCommand(topicArray[2], payloadStr);
    } else {
      console.error("Invalid topic format[%s], payload:", topic, payloadStr);
    }
  }

  function _displayMessages(type, value) {
    var messageTags = $mcsbContainer.find(".chat-message");

    //$contentArea.mCustomScrollbar("scrollTo", "bottom");

    if(Array.isArray(value)) {
      if(MESSAGE_TYPE_APPEND === type) {
        for (var key = 0; key < value.length; key++) {
          if(value[key - 1] && value[key - 1].date != value[key].date) {
            $mcsbContainer.append(Mustache.render(dateLineTemplate, {"date" : value[key].date}));
          }
          $mcsbContainer.append(Mustache.render(msgTemplate, value[key]));
        }
        $contentArea.mCustomScrollbar("scrollTo", "bottom");
      } else {
        // prepend mode
        var firstDate = messageTags ? messageTags.first().data("date") : undefined;
        for (var key = (value.length-1); key > -1; key--) {
          $mcsbContainer.prepend(Mustache.render(msgTemplate, value[key]));

          if (key === (value.length-1)) {
            if(firstDate && value[key].date != firstDate) {
              $mcsbContainer.prepend(Mustache.render(dateLineTemplate, {"date" : value[key].date}));
            }
          } else {
            if(value[key - 1] && value[key - 1].date != value[key].date) {
              $mcsbContainer.prepend(Mustache.render(dateLineTemplate, {"date" : value[key].date}));
            }
          }
        }
      }

    } else {
      if(MESSAGE_TYPE_APPEND === type) {
        var lastDate = messageTags ? messageTags.last().data("date"): undefined;
        if(lastDate && value.date != lastDate) {
          $mcsbContainer.append(Mustache.render(dateLineTemplate, {"date" : value.date}));
        }
        $mcsbContainer.append(Mustache.render(msgTemplate, value));
        $contentArea.mCustomScrollbar("scrollTo", "bottom");
      }
    }
  }

  function _handleCommand(receiver, payloadStr) {
    console.info("_handleCommand information %s, %s", receiver, payloadStr);

    if(receiver != myPref.emplId) {
      console.error("reciver not match %s, %s", reciver, myPref.emplId);
      return;
    }

    var commandPayload = JSON.parse(payloadStr);
    /*
      msgPayload = {
        type:  // COMMAND 타입 (client 담당)
        ...  // 각 command 타입에 따른 return value
      }
    */

    switch (commandPayload.type) {
      // group 관련
      case constants.GROUP_CREATE:
        catalogSection.displayChannel(commandPayload);
      break;
      case constants.GROUP_ADD_MEMBER:
        catalogSection.reloadChannelCache(commandPayload.channelId);
        // Active 채팅방과 멤버 추가되는 channel이 동일 할경우 asidesection에 member 추가
        if(activeChatInfo && activeChatInfo.chatRoomId === commandPayload.channelId) {
          informationSection.displayMember(commandPayload.newMembers);
        }
      break;
      case constants.GROUP_REMOVE_MEMBER:
        catalogSection.reloadChannelCache(commandPayload.channelId);

        if(myPref.emplId === commandPayload.member) {
          // 화면 닫기 & 리스트제거
          informationSection.hideSection();
          chatSection.hideSection();
          catalogSection.removeChannel(commandPayload.channelId);
          screenshareSection.hideSection();
        } else {
          if(activeChatInfo && activeChatInfo.chatRoomId === commandPayload.channelId) {
            // 사용자 제거
            informationSection.hideMember(commandPayload.member);
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
      var userObj = catalogSection.getUserObj(msgPayload.publisher);
      var params = {
        spkrId : msgPayload.publisher,
        chatId : msgPayload.msgid,
        msg : msgPayload.msg,
        publisherLoginId : (userObj !== null) ? userObj.loginId : "Unknown[" + msgPayload.publisher + "]",
        creTime : msgPayload.time
      };

      var message = myMessage.madeMessageUnit(params);

      /*
        * 화면 display 조건
        group 일 때 ?
        - receiver가 active chatRoomId 동일 해야함
        direct 일 때?
        - receiver나 publisher가  active chatRoomId 동일 해야함
      */
      if(activeChatInfo && activeChatInfo.chatType === msgPayload.chatType && (activeChatInfo.chatRoomId  === msgPayload.publisher || activeChatInfo.chatRoomId === msgPayload.receiver)) {
        _displayMessages(MESSAGE_TYPE_APPEND, message);
        $contentArea.mCustomScrollbar("scrollTo", "bottom");
      } else {
        catalogSection.setAlarmCnt(msgPayload.chatType, msgPayload.chatType === constants.DIRECT_CHAT ? msgPayload.publisher : msgPayload.receiver);
      }

      // Store messages
      var chatRoomId;
      if(msgPayload.chatType === constants.DIRECT_CHAT)
      {
        chatRoomId = sendMode ?  msgPayload.receiver : msgPayload.publisher;
      } else {
        chatRoomId = msgPayload.receiver;
      }

      myMessage.appendChatMessage(message, msgPayload.chatType, chatRoomId);
    }
  }

  function _handlePresence(topic, payloadStr) {
    // todo : display presence info
    console.info("topic[%s], payload:", topic, payloadStr);
  }

  function initChatSection() {
    _initialize();

    var coId = myPref.coId;
    var emplId = myPref.emplId;
    var loginId = myPref.loginId;

    console.log("initChatSection[coId:%s, emplId:%s, loginId:%s]", coId, emplId, loginId);

    chatModule.configMyInfo(coId, emplId, loginId, recvMsg);
  }

  function resizeInChatSection() {
    var windowHeight = $(window).height();
    var headerHeight = $("#header-section").outerHeight(true);
    var chatInputHeight = $chatSec.find(".ibox-footer").outerHeight(true);
    var chatHeight =  windowHeight - headerHeight - chatInputHeight - 1;

    $chatSec.find(".content_area").css("height", chatHeight);
  }

  function loadChatSection() {
    loadHtml("./html/chat/chat_section.html", $("#chat-section"));
  }

  function changeChatView(chatType, chatRoomId, chatRoomName) {
    console.log("chatType:%s, chatRoomId:%s, chatRoomName:%s",chatType, chatRoomId, chatRoomName);

    // remove chatting texts
    $.each($contentArea.find(".chat-message"), function(idx, row) {
      $(row).remove();
    });

    $.each($contentArea.find(".date_line"), function(idx, row) {
      $(row).remove();
    });

    callSection.hideSection();
    showSection(); // chat Area

    screenshareSection.hideSection();
    catalogSection.hideAlram(chatType, chatRoomId); // init Alram
    headerSection.setTitle(chatType, chatRoomName);

    if(chatType === constants.GROUP_CHAT) {
      var channelValue = catalogSection.getChannelObj(chatRoomId);
      var members = []; // for mention
      for(var key in channelValue.memberList) {
        var userValue = catalogSection.getUserObj(channelValue.memberList[key].emplId);

        //본인 제외
        if(userValue.emplId == myPref.emplId)
          continue;

        members.push({
          "username" : userValue.loginId,
          "image": "../img/profile_img" + userValue.emplId % 10 + ".jpg"
        });
      }

      $mentionText.mention("updateUsers", members);
    }

    var messageArray = myMessage.getAllChatMessage(activeChatInfo.chatType, activeChatInfo.chatRoomId); // get previous messages
    if(messageArray) {
      _displayMessages(MESSAGE_TYPE_APPEND, messageArray);
    }
  }

  function getPreviousMessage() {
    myMessage.getPreviousChatMessage(activeChatInfo.chatType, activeChatInfo.chatRoomId, function(messageArray) {
      _displayMessages(MESSAGE_TYPE_PREPEND, messageArray);
    });
  }

  function finalize() {
    chatModule.finalize();
  }

  function hideSection() {
    $chatSec.hide();
  }

  function showSection() {
    $chatSec.show();
  }

  function reloadSection() {
    finalize();

    var coId = myPref.coId;
    var emplId = myPref.emplId;
    var loginId = myPref.loginId;
    chatModule.configMyInfo(coId, emplId, loginId, recvMsg);
  }

  return {
    initChatSection: initChatSection,
    loadChatSection: loadChatSection,
    resizeInChatSection: resizeInChatSection,
    hideSection : hideSection,
    showSection : showSection,
    reloadSection: reloadSection,
    sendMsg: sendMsg,
    recvMsg: recvMsg,
    changeChatView: changeChatView,
    finalize: finalize,
    getPreviousMessage: getPreviousMessage
  };
})();

module.exports = chatSection;
