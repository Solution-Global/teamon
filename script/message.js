var message = (function(storageManager, myPref) {

  var KEY_TYPE_CHAT_MESSAGES = 1;
  var KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID = 2;

  /*
    - Lacal storage 에 저장 되는 message 관련 포맷
    message keys : CHAT_LAST_READ_MSGID_[login emplId]
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

  var cacheMessage = new cacheManager();
  var cacheFirstMsgId = new cacheManager();

  function syncChatMessage(chatType, targetArray) {
    var restFunction = function(msgData, callBackRequiredValues) {
      if (msgData.length > 0) {
        var messageArray = [];
        $.each(msgData, function(idx, msgRow) {
          var message = {
            senderId: msgRow.senderId,
            chatId: msgRow.chatId,
            creTime: msgRow.creTime,
            msg: msgRow.msg
          };
          messageArray.push(message);
        });
        _appendMessageArray(messageArray, callBackRequiredValues.topic);
      }
    };

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
        topic = targetArray[key].name;
      }
      restPrams.topic = topic;
      restResource.chat.getListByCondition(restPrams, {"topic" : topic}, restFunction);
    }
  }

  // Local Stroage 저장된 파일에서 과거 메시지 가져와 local storage에 저장
  function getPreviousChatMessage(topic, callback) {
    var restPrams = {
      "teamId": myPref.teamId,
      "emplId": myPref.emplId,
      "topic": topic
    };

    var firstMsgId = cacheFirstMsgId.get(topic);
    if (firstMsgId) {
      restPrams.firstMsgId = firstMsgId;
    }

    restResource.chat.getListByCondition(restPrams, {}, function(msgData) {
      if (msgData.length > 0) {
        var messageArray = [];
        $.each(msgData, function(idx, msgRow) {
          messageArray.push({
            senderId: msgRow.senderId,
            chatId: msgRow.chatId,
            creTime: msgRow.creTime,
            msg: msgRow.msg
          });
        });
        _prependMessageArray(messageArray, topic); // 새로운 Array 전달
        callback(messageArray);
      }
    });
  }

  function _getKeyName(keyType, topic) {
    var keyName;
    switch (keyType) {
      case KEY_TYPE_CHAT_MESSAGES:
        keyName = "CHAT_" + myPref.emplId + "_" + topic;
        break;
      case KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID:
        keyName = "CHAT_LAST_READ_MESSAGE_ID_" + myPref.emplId;
        break;
    }
    return keyName;
  }

  function _writeAll(keyType, value, topic) {
    var keyName = _getKeyName(keyType, topic);
    storageManager.setValue(keyName, value);
  }

  function _readAll(keyType, topic) {
    var keyName = _getKeyName(keyType, topic);
    return storageManager.getValue(keyName);
  }

  // 모든 메시지 가져오기
  function getAllChatMessage(topic) {
    var messages = cacheMessage.get(topic); // Memory에 value를 우선한다.
    if(messages)
      return messages;

    var value = _readAll(KEY_TYPE_CHAT_MESSAGES, topic);
    if (value)
      return JSON.parse(value);
  }

  function appendMessageUnit(msgRow, topic) {
    var messages = getAllChatMessage(topic);
    if(!messages) {
      messages = [];
    }

    messages.push(msgRow);
    cacheFirstMsgId.set(topic, msgRow.chatId);
    cacheMessage.set(topic, messages);
  }

  function _prependMessageArray(value, topic) {
    var messages = getAllChatMessage(topic);
    if(!messages)
      messages = [];

    cacheFirstMsgId.set(topic, value[0].chatId);
    cacheMessage.set(topic, value.concat(messages));
  }

  function _appendMessageArray(value, topic) {
    cacheFirstMsgId.set(topic, value[0].chatId);

    // setLastReadMessageId : 추후 수정
    setLastReadMessageId(topic, value[value.length-1].chatId );
    _writeAll(KEY_TYPE_CHAT_MESSAGES, JSON.stringify(value), topic);
  }

  function setLastReadMessageId(topic, lastMsgId) {
    var LastReadMessageIdstr = _readAll(KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID);
    var LastReadMessageIdObj = {};
    if (LastReadMessageIdstr) {
      LastReadMessageIdObj = JSON.parse(LastReadMessageIdstr);
    }
    LastReadMessageIdObj[topic] = lastMsgId;

    _writeAll(KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID, JSON.stringify(LastReadMessageIdObj));
  }

  function getLastReadMessageId(topic) {
    var LastReadMessageIdstr = _readAll(KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID);
    var LastReadMessageIdObj = {};
    if (LastReadMessageIdstr) {
      LastReadMessageIdObj = JSON.parse(LastReadMessageIdstr);
    }
    return LastReadMessageIdObj[topic];
  }

  return {
    syncChatMessage: syncChatMessage,
    getAllChatMessage: getAllChatMessage,
    getPreviousChatMessage : getPreviousChatMessage ,
    appendMessageUnit: appendMessageUnit,
    setLastReadMessageId: setLastReadMessageId,
    getLastReadMessageId: getLastReadMessageId
  };
});

module.exports = message;
