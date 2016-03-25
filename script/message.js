var message = (function(storageManager, myPref) {
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

  function _getKeyName(topic) {
    return "CHAT_" + myPref.emplId + "_" + topic;
  }

  function _writeAll(topic, value) {
    var keyName = _getKeyName(topic);
    storageManager.setValue(keyName, value);
  }

  function _readAll(topic) {
    var keyName = _getKeyName(topic);
    return storageManager.getValue(keyName);
  }

  // 모든 메시지 가져오기
  function getAllChatMessage(topic) {
    var messages = cacheMessage.get(topic); // Memory에 value를 우선한다.
    if(messages)
      return messages;

    var value = _readAll(topic);
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
    _writeAll(topic, JSON.stringify(value));
  }

  return {
    syncChatMessage: syncChatMessage,
    getAllChatMessage: getAllChatMessage,
    getPreviousChatMessage : getPreviousChatMessage ,
    appendMessageUnit: appendMessageUnit
  };
});

module.exports = message;
