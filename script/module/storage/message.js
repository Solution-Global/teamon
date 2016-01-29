'use strict';

var constants = require("../constants");
/*
  - Lacal storage 에 저장 되는 message 관련 포맷
  key : CHAT_FIRST_MSGID_[myPref.emplId]  or CHAT_LAST_MSGID_[myPref.emplId]
  value : format is JSON.
  { "direct" : {
    "1": 100, -- targetEmplId : messageId
    "2" : 200,
    ...
  },
  "group" : {
    "1": 200,
    "2" : 300,
    ...
  }}

  Key : CHAT_[coId]_[myPref.emplId]_[myPref.targetId]
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

var message = (function(storage, pref) {
  const KEY_TYPE_CHAT_MESSAGES = 1;
  const KEY_TYPE_CHAT_FIRST_MESSAGE_ID = 2;
  const KEY_TYPE_CHAT_LAST_MESSAGE_ID = 3;

  var storageManager = storage;
  var myPref = pref;
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
        keyName = "CHAT_" + params.chatType + "_" + myPref.emplId + "_" + params.targetEmplId;
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
    var sender = sendMode ? myPref.loginId : params.targetLoginId;
    // img file (TODO 이후 사용자 이미지를 서버에 저장할 경우 photoLoc 정보를 이용하여 서버에서 가져와 로컬에 저장)
    var imgIdx = (params.spkrId * 1) % 10;

    var message = {
      "msgId": params.dcId,
      "mode": sendMode ? "right" : "left", // send : right or receive : left
      "img": "../img/profile_img" + imgIdx + ".jpg",
      "imgAlt": sender,
      "sender": sender,
      "msgText": params.msg,
      "date": new Date(params.creTime).format("yyyy/MM/dd"),
      "time": new Date(params.creTime).format("a/p hh mm")
    };

    return message;
  }

  // 메시지 첫 메시지 아이디 저장하기
  function _setChatFirstMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_FIRST_MESSAGE_ID;
    _readAll(params);
    var chatType = _getChatTypeToStr(params.chatType);
    chatFirstMessagIdJson[chatType][String(params.targetEmplId)] = params.value;
    _writeAll(params);
  }

  // 메시지 첫 메시지 아이디 가져오기
  function _getChatFirstMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_FIRST_MESSAGE_ID;
    _readAll(params);

    var chatType = _getChatTypeToStr(params.chatType);
    if (!chatFirstMessagIdJson[chatType])
      return;

    return chatFirstMessagIdJson[chatType][String(params.targetEmplId)];
  }

  // 메시지 마지막 메시지 아이디 저장하기
  function _setChatLastMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_LAST_MESSAGE_ID;
    _readAll(params);
    var chatType = _getChatTypeToStr(params.chatType);
    chatLastMessagIdJson[chatType][String(params.targetEmplId)] = params.value;
    _writeAll(params);
  }

  // 메시지 마지막 메시지 아이디 가져오기
  function _getChatLastMessageId(params) {
    params.keyType = KEY_TYPE_CHAT_LAST_MESSAGE_ID;
    _readAll(params);

    var chatType = _getChatTypeToStr(params.chatType);
    if (!chatLastMessagIdJson[chatType])
      return;

    return chatLastMessagIdJson[chatType][String(params.targetEmplId)];
  }

  // 모든 메시지 가져오기
  function getAllChatMessage(chatType, targetEmplId) {
    var params = {
      "keyType": KEY_TYPE_CHAT_MESSAGES,
      "chatType": chatType,
      "targetEmplId": targetEmplId
    };

    var value = _readAll(params);
    if (value)
      return JSON.parse("[" + value + "]");
  }

  function _prependChatMessage(value, chatType, targetEmplId) {
    var params = {
      "chatType": chatType,
      "targetEmplId": targetEmplId
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

  function appendChatMessage(value, chatType, targetEmplId) {
    var params = {
      "chatType": chatType,
      "targetEmplId": targetEmplId
    };

    var message = JSON.stringify(value);
    var msgId;
    if (Array.isArray(value)) {
      // 배열일 때 첫 글자와 마지막 삭제
      message = message.slice(1, message.length - 1);
      msgId = value[value.length - 1].msgId;
    } else {
      msgId = value.msgId;
    }

    params.keyType = KEY_TYPE_CHAT_MESSAGES;
    var storredMessages = _readAll(params);
    if (storredMessages) {
      storredMessages = storredMessages + ("," + message);
    } else {
      storredMessages = message;
      params.value = value.msgId;
      _setChatFirstMessageId(params);
    }

    params.value = storredMessages;
    params.keyType = KEY_TYPE_CHAT_MESSAGES;
    _writeAll(params);
    params.value = msgId;
    _setChatLastMessageId(params);
  }

  // Local Stroage 저장된 파일에서 과거 메시지 가져와 local storage에 저장
  function getPreviousChatMessage(chatType, targetEmplId, targetLoginId, callback) {
    var restPrams = {
      "coId": myPref.coId,
      "chatType": chatType,
      "peer1": Math.min.apply(null, [myPref.emplId, targetEmplId]),
      "peer2": Math.max.apply(null, [myPref.emplId, targetEmplId])
    };

    var firstMsgId = _getChatFirstMessageId({
      "chatType": chatType,
      "targetEmplId": targetEmplId
    });
    if (firstMsgId) {
      restPrams.firstMsgId = firstMsgId;
    }

    restResourse.chat.getListByPeers(restPrams, function(msgData) {
      if (msgData.length > 0) {
        var messageArray = new Array();
        $.each(msgData, function(idx, msgRow) {
          msgRow.targetLoginId = targetLoginId;
          messageArray.push(madeMessageUnit(msgRow));
        });
        _prependChatMessage(messageArray, chatType, targetEmplId);
        callback(messageArray);
      }
    });
  }

  // 서버에 저장된 message와 LocalDB sync, 처음 login시 한번 실행
  function syncChatMessage() {
    restResourse.empl.getListByCoid({
      "coId": myPref.coId
    }, function(emplData) {
      if (emplData.rows.length > 0) {
        $.each(emplData.rows, function(idx, emplRow) {
          var restPrams = {
            "coId": myPref.coId,
            "chatType": constants.DIRECT_CHAT,
            "peer1": Math.min.apply(null, [myPref.emplId, emplRow.emplId]),
            "peer2": Math.max.apply(null, [myPref.emplId, emplRow.emplId])
          };

          var lastMsgId = _getChatLastMessageId({
            "chatType": constants.DIRECT_CHAT,
            "targetEmplId": emplRow.emplId
          });
          if (lastMsgId) {
            restPrams.lastMsgId = lastMsgId;
          }

          restResourse.chat.getListByPeers(restPrams, function(msgData) {
            if (msgData.length > 0) {
              var messageArray = new Array();
              $.each(msgData, function(idx, msgRow) {
                msgRow.targetLoginId = emplRow.loginId;
                messageArray.push(madeMessageUnit(msgRow));
              });
              appendChatMessage(messageArray, constants.DIRECT_CHAT, emplRow.emplId);
            }
          });
        });
      }
    });
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
