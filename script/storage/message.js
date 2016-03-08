/*
  - Lacal storage 에 저장 되는 message 관련 포맷
  message keys : CHAT_FIRST_CHATID_[login emplId]  or CHAT_LAST_CHATID_[login emplId]
  value : format is JSON.
  {
    "1_3": 100, -- topic : messageId
    "3_5" : 200,
    "#63" : 200,
    ...
  }

  messages : CHAT_[login emplId]_[topic]
  value :
  { "chatId":613,
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
  const KEY_TYPE_CHAT_FIRST_CHAT_ID = 2;
  const KEY_TYPE_CHAT_LAST_CHAT_ID = 3;

  var chatFirstMessagIdJson = {};
  var chatLastMessagIdJson = {};

  function _readAll(params) {
    var keyName = _getKeyName(params);
    var value = storageManager.getValue(keyName);

    if (value) {
      switch (params.keyType) {
        case KEY_TYPE_CHAT_FIRST_CHAT_ID:
          chatFirstMessagIdJson = JSON.parse(value);
          return;
        case KEY_TYPE_CHAT_LAST_CHAT_ID:
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
      case KEY_TYPE_CHAT_FIRST_CHAT_ID:
        storageManager.setValue(keyName, JSON.stringify(chatFirstMessagIdJson));
        break;
      case KEY_TYPE_CHAT_LAST_CHAT_ID:
        storageManager.setValue(keyName, JSON.stringify(chatLastMessagIdJson));
        break;
    }
  }

  function _getKeyName(params) {
    var keyName;
    switch (params.keyType) {
      case KEY_TYPE_CHAT_MESSAGES:
        keyName = "CHAT_" + myPref.emplId + "_" + params.topic;
        break;
      case KEY_TYPE_CHAT_FIRST_CHAT_ID:
        keyName = "CHAT_FIRST_CHATID_" + myPref.emplId;
        break;
      case KEY_TYPE_CHAT_LAST_CHAT_ID:
        keyName = "CHAT_LAST_CHATID_" + myPref.emplId;
        break;
    }
    return keyName;
  }

  // Local DB에 저장되는 Message Unit의 포맷 설정
  function madeMessageUnit(params) {
    var sendMode = myPref.emplId === params.senderId;
    var sender = sendMode ? myPref.name : userCache.get(params.senderId).name;

    if(runningChannel === constants.CHANNEL_APP) {
        imgFile = "file://" + path.join(__dirname, '../../img/profile_no.jpg');
    } else {
        imgFile = "../img/profile_no.jpg";
    }

    var message = {
      "chatId": params.chatId,
      "mode": sendMode ? "right" : "left", // send : right or receive : left
      "img": imgFile,
      "imgAlt": sender,
      "sender": sender,
      "msgText": params.msg,
      "date": new Date(params.creTime).format("YYYY/MM/DD"),
      "time": new Date(params.creTime).format("A hh:mm")
    };

    return message;
  }

  // 메시지 첫 메시지 아이디 저장하기
  function _setChatFirstChatId(params) {
    params.keyType = KEY_TYPE_CHAT_FIRST_CHAT_ID;
    _readAll(params);
    chatFirstMessagIdJson[String(params.topic)] = params.value;
    _writeAll(params);
  }

  // 메시지 첫 메시지 아이디 가져오기
  function _getChatFirstChatId(params) {
    params.keyType = KEY_TYPE_CHAT_FIRST_CHAT_ID;
    _readAll(params);
    return chatFirstMessagIdJson[String(params.topic)];
  }

  // 메시지 마지막 메시지 아이디 저장하기
  function _setChatLastChatId(params) {
    params.keyType = KEY_TYPE_CHAT_LAST_CHAT_ID;
    _readAll(params);
    chatLastMessagIdJson[String(params.topic)] = params.value;
    _writeAll(params);
  }

  // 메시지 마지막 메시지 아이디 가져오기
  function _getChatLastChatId(params) {
    params.keyType = KEY_TYPE_CHAT_LAST_CHAT_ID;
    _readAll(params);
    return chatLastMessagIdJson[String(params.topic)];
  }

  // 모든 메시지 가져오기
  function getAllChatMessage(topic) {
    var params = {
      "keyType": KEY_TYPE_CHAT_MESSAGES,
      "topic" : topic
    };

    var value = _readAll(params);
    if (value)
      return JSON.parse("[" + value + "]");
  }

  function _prependChatMessage(value, topic) {
    var params = {
      "topic" : topic
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
      params.value = value[0].chatId;
      _setChatFirstChatId(params);
    }
  }

  function appendChatMessage(value, topic) {
    var params = {
      "topic" : topic
    };

    var messageJsonFormat = JSON.stringify(value);
    var lastChatId;
    var firstChatId;
    if (Array.isArray(value)) {
      // 배열일 때 첫 글자와 마지막 삭제
      messageJsonFormat = messageJsonFormat.slice(1, messageJsonFormat.length - 1);
      lastChatId = value[value.length - 1].chatId;
      firstChatId = value[0].chatId;
    } else {
      lastChatId = value.chatId;
      firstChatId = value.chatId;
    }

    params.keyType = KEY_TYPE_CHAT_MESSAGES; // add param
    var storredMessages = _readAll(params);

    if (storredMessages) {
      storredMessages = storredMessages + ("," + messageJsonFormat);
    } else {
      storredMessages = messageJsonFormat;
      params.value = firstChatId; // add param
      _setChatFirstChatId(params);
    }

    params.value = storredMessages; // modify param
    params.keyType = KEY_TYPE_CHAT_MESSAGES; // modifiy param
    _writeAll(params);
    params.value = lastChatId;
    _setChatLastChatId(params);
  }

  // Local Stroage 저장된 파일에서 과거 메시지 가져와 local storage에 저장
  function getPreviousChatMessage(topic, callback) {
    var restPrams = {
      "teamId": myPref.teamId,
      "emplId": myPref.emplId,
      "topic": topic
    };

    var firstChatId = _getChatFirstChatId({
      "topic": topic
    });
    if (firstChatId) {
      restPrams.firstChatId = firstChatId;
    }

    restResourse.chat.getListByCondition(restPrams, {}, function(msgData) {
      if (msgData.length > 0) {
        var messageArray = new Array();
        $.each(msgData, function(idx, msgRow) {
          messageArray.push(madeMessageUnit(msgRow));
        });
        _prependChatMessage(messageArray, topic);
        callback(messageArray);
      }
    });
  }

  // 서버에 저장된 message와 LocalDB sync, 처음 login시 한번 실행
  function syncChatMessage(chatType, targetArray) {
    for(var key in targetArray) {
      var topic;
      var restPrams = {
        "teamId": myPref.teamId,
        "emplId": myPref.emplId
      };

      if(constants.DIRECT_CHAT === chatType) {
        if(myPref.emplId === targetArray[key].emplId)
          continue;
        topic = generateTopic(myPref.emplId, targetArray[key].emplId);
      } else {
        topic = targetArray[key].channelId;
      }
      restPrams.topic = topic;

      var lastChatId = _getChatLastChatId({"topic": topic});
      if (lastChatId) {
        restPrams.lastChatId = lastChatId;
      }

      restResourse.chat.getListByCondition(restPrams, {"topic" : topic}, function(msgData, callBackRequiredValues) {
        if (msgData.length > 0) {
          var messageArray = new Array();
          $.each(msgData, function(idx, msgRow) {
            messageArray.push(madeMessageUnit(msgRow));
          });
          appendChatMessage(messageArray, callBackRequiredValues.topic);
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
