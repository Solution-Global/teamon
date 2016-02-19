'use strict';

var constants = require("../constants");
/*
  - Lacal storage 에 저장 되는 message 관련 포맷
  key : CHAT_FIRST_MSGID_[login emplId]  or CHAT_LAST_MSGID_[login emplId]
  value : format is JSON.
  { "direct" : {
    "1": 100, -- EmplId : messageId
    "2" : 200,
    ...
  },
  "group" : {
    "1": 200, -- channelId : messageId
    "2" : 300,
    ...
  }}

  Direct Key : CHAT_[coId]_[login emplId]_[opponentEmplId]
  Group Key : CHAT_[coId]_[login emplId]_[channelId]
  value :
  { "msgId":613,
  "mode":"send",
  "img":"../img/profile_img2.jpg",
  "imgAlt":"sales",
  "sender":"sales",
  "msgText":"rbt 임",
  "date":"2016/06/19",
  "time":"오후 03 06"
  },
  ...
*/

var message = (function(storageManager, myPref, userCache, channelCache) {
  const KEY_TYPE_CHAT_MESSAGES = 1;
  const KEY_TYPE_CHAT_FIRST_MESSAGE_ID = 2;
  const KEY_TYPE_CHAT_LAST_MESSAGE_ID = 3;

  var chatFirstMessagIdJson = {
    "direct": {},
    "group": {}
  };
  var chatLastMessagIdJson = {
    "direct": {},
    "group": {}
  };

  function _readAll(params) {
    var keyName = _getKeyName(params);
    var value = storageManager.getValue(keyName);

    if (value) {
      switch (params.keyType) {
        case KEY_TYPE_CHAT_FIRST_MESSAGE_ID:
          chatFirstMessagIdJson = JSON.parse(value);
          return;
        case KEY_TYPE_CHAT_LAST_MESSAGE_ID:
          chatLastMessagIdJson = JSON.parse(value);
          return;
      }
    }
    return value;
  }

  function _writeAll(params) {
    var keyName = _getKeyName(params);

    switch (params.keyType) {
      case KEY_TYPE_CHAT_MESSAGES:
        storageManager.setValue(keyName, params.value);
        break;
      case KEY_TYPE_CHAT_FIRST_MESSAGE_ID:
        storageManager.setValue(keyName, JSON.stringify(chatFirstMessagIdJson));
        break;
      case KEY_TYPE_CHAT_LAST_MESSAGE_ID:
        storageManager.setValue(keyName, JSON.stringify(chatLastMessagIdJson));
        break;
    }
  }

  function _getKeyName(params) {
    var keyName;
    switch (params.keyType) {
      case KEY_TYPE_CHAT_MESSAGES:
        keyName = "CHAT_" + params.chatType + "_" + myPref.emplId + "_" + params.chatRoomId;
        break;
      case KEY_TYPE_CHAT_FIRST_MESSAGE_ID:
        keyName = "CHAT_FIRST_MSGID_" + myPref.emplId;
        break;
      case KEY_TYPE_CHAT_LAST_MESSAGE_ID:
        keyName = "CHAT_LAST_MSGID_" + myPref.emplId;
        break;
    }
    return keyName;
  }

  function _getChatTypeToStr(chatType) {
    var chatTypeStr = "direct";
    if (chatType === constants.GROUP_CHAT)
      chatTypeStr = "group";

    return chatTypeStr;
  }

  // Local DB에 저장되는 Message Unit의 포맷 설정
  function madeMessageUnit(params) {
    var sendMode = myPref.emplId === params.spkrId;
    var sender = sendMode ? myPref.loginId : params.publisherLoginId;

    var imgIdx = (params.spkrId * 1) % 10;

    var message = {
      "msgId": params.chatId,
      "mode": sendMode ? "right" : "left", // send : right or receive : left
      "img": "../img/profile_img" + imgIdx % 10 + ".jpg",
      "imgAlt": sender,
      "sender": sender,
      "msgText": params.msg,
      "date": new Date(params.creTime).format("YYYY/MM/DD"),
      "time": new Date(params.creTime).format("A hh mm")
    };

    return message;
  }

  // 메시지 첫 메시지 아이디 저장하기
  function _setChatFirstMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_FIRST_MESSAGE_ID;
    _readAll(params);
    var chatType = _getChatTypeToStr(params.chatType);
    chatFirstMessagIdJson[chatType][String(params.chatRoomId)] = params.value;

    _writeAll(params);
  }

  // 메시지 첫 메시지 아이디 가져오기
  function _getChatFirstMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_FIRST_MESSAGE_ID;
    _readAll(params);

    var chatType = _getChatTypeToStr(params.chatType);
    if (!chatFirstMessagIdJson[chatType])
      return;

    return chatFirstMessagIdJson[chatType][String(params.chatRoomId)];
  }

  // 메시지 마지막 메시지 아이디 저장하기
  function _setChatLastMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_LAST_MESSAGE_ID;
    _readAll(params);
    var chatType = _getChatTypeToStr(params.chatType);

    chatLastMessagIdJson[chatType][String(params.chatRoomId)] = params.value;
    _writeAll(params);
  }

  // 메시지 마지막 메시지 아이디 가져오기
  function _getChatLastMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_LAST_MESSAGE_ID;
    _readAll(params);

    var chatType = _getChatTypeToStr(params.chatType);
    if (!chatLastMessagIdJson[chatType])
      return;

    return chatLastMessagIdJson[chatType][String(params.chatRoomId)];
  }

  // 모든 메시지 가져오기
  function getAllChatMessage(chatType, id) {
    var params = {
      "keyType": KEY_TYPE_CHAT_MESSAGES,
      "chatType": chatType,
      "chatRoomId" : id
    };

    var value = _readAll(params);
    if (value)
      return JSON.parse("[" + value + "]");
  }

  function _prependChatMessage(value, chatType, id) {
    var params = {
      "chatType": chatType,
      "chatRoomId" : id
    };

    var message = JSON.stringify(value);
    if (Array.isArray(value)) {
      // 배열일 때 첫 글자와 마지막 삭제
      message = message.slice(1, message.length - 1);
    }

    params.keyType = KEY_TYPE_CHAT_MESSAGES;
    var storredMessages = _readAll(params);
    if (storredMessages) {
      storredMessages = (message + ",") + storredMessages;
      params.value = storredMessages;
      params.keyType = KEY_TYPE_CHAT_MESSAGES;
      _writeAll(params);
      params.value = value[0].msgId;
      _setChatFirstMessageId(params);
    }
  }

  function appendChatMessage(value, chatType, id) {
    var params = {
      "chatType": chatType,
      "chatRoomId" : id
    };

    var messageJsonFormat = JSON.stringify(value);
    var lastMsgId;
    var firstMsgId;
    if (Array.isArray(value)) {
      // 배열일 때 첫 글자와 마지막 삭제
      messageJsonFormat = messageJsonFormat.slice(1, messageJsonFormat.length - 1);
      lastMsgId = value[value.length - 1].msgId;
      firstMsgId = value[0].msgId;
    } else {
      lastMsgId = value.msgId;
      firstMsgId = value.msgId;
    }

    params.keyType = KEY_TYPE_CHAT_MESSAGES; // add param
    var storredMessages = _readAll(params);
    if (storredMessages) {
      storredMessages = storredMessages + ("," + messageJsonFormat);
    } else {
      storredMessages = messageJsonFormat;
      params.value = firstMsgId; // add param
      _setChatFirstMessageId(params);
    }

    params.value = storredMessages; // modify param
    params.keyType = KEY_TYPE_CHAT_MESSAGES; // modifiy param
    _writeAll(params);
    params.value = lastMsgId;
    _setChatLastMessageId(params);
  }

  // Local Stroage 저장된 파일에서 과거 메시지 가져와 local storage에 저장
  function getPreviousChatMessage(chatType, chatRoomId, callback) {
    var restPrams = {
      "coId": myPref.coId,
      "chatType": chatType
    };

    if(constants.DIRECT_CHAT === chatType) {
      restPrams["peer1"] = Math.min.apply(null, [myPref.emplId, chatRoomId]);
      restPrams["peer2"] = Math.max.apply(null, [myPref.emplId, chatRoomId]);
    } else {
      restPrams["peer2"] = chatRoomId;
    }

    var firstMsgId = _getChatFirstMessageId({
      "chatType": chatType,
      "chatRoomId": chatRoomId
    });
    if (firstMsgId) {
      restPrams.firstMsgId = firstMsgId;
    }

    restResourse.chat.getListByPeers(restPrams, {}, function(msgData) {
      if (msgData.length > 0) {
        var messageArray = new Array();
        $.each(msgData, function(idx, msgRow) {
          msgRow.publisherLoginId = userCache.get(msgRow.spkrId).loginId;;
          messageArray.push(madeMessageUnit(msgRow));
        });
        _prependChatMessage(messageArray, chatType, chatRoomId);
        callback(messageArray);
      }
    });
  }

  // 서버에 저장된 message와 LocalDB sync, 처음 login시 한번 실행
  function syncChatMessage(chatType) {
    var targetArray;
    if(constants.DIRECT_CHAT === chatType)
      targetArray = userCache.getValueArray();
    else
      targetArray = channelCache.getValueArray();

    for(var key in targetArray) {
      var chatRoomId;
      var restPrams = {
        "coId": myPref.coId,
        "chatType": chatType
      };

      if(constants.DIRECT_CHAT === chatType) {
        chatRoomId = targetArray[key].emplId;
        restPrams["peer1"] = Math.min.apply(null, [myPref.emplId, chatRoomId]);
        restPrams["peer2"] = Math.max.apply(null, [myPref.emplId, chatRoomId]);
      } else {
        chatRoomId = targetArray[key].channelId;
        restPrams["peer2"] = chatRoomId;
      }

      var lastMsgId = _getChatLastMessageId({
        "chatType": chatType,
        "chatRoomId": chatRoomId
      });
      if (lastMsgId) {
        restPrams.lastMsgId = lastMsgId;
      }

      restResourse.chat.getListByPeers(restPrams, {"chatRoomId" : chatRoomId}, function(msgData, callBackRequiredValues) {
        if (msgData.length > 0) {
          var messageArray = new Array();
          $.each(msgData, function(idx, msgRow) {
            msgRow.publisherLoginId = userCache.get(String(msgRow.spkrId)).loginId;
            messageArray.push(madeMessageUnit(msgRow));
          });
          appendChatMessage(messageArray, chatType, callBackRequiredValues.chatRoomId);
        }
      });
    }
  }

  return {
    syncChatMessage: syncChatMessage,
    getAllChatMessage: getAllChatMessage,
    appendChatMessage: appendChatMessage,
    getPreviousChatMessage: getPreviousChatMessage,
    madeMessageUnit: madeMessageUnit
  };
});

module.exports = message;
