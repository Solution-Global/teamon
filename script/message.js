var message = (function(storageManager) {

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

  var messageCache = new CacheManager();
  var firstMsgIdCache = new CacheManager();

  function syncChatMessage(chatType, targetArray, callback) {
    var restParams = {
      "teamId": loginInfo.teamId,
      "emplId": loginInfo.emplId
    };

    var lastMsgIdArr = [];
    var localMessageList = {};

    // get lastMsgId as an array from all the topics
    for (var key in targetArray) {
      var topic;

      if (constants.DIRECT_CHAT === chatType) {
        // ignore if target is me
        if (loginInfo.emplId === targetArray[key].emplId)
          continue;
        topic = generateTopic(loginInfo.emplId, targetArray[key].emplId);
      } else {
        topic = targetArray[key].name;
      }

      var lastMsgIdObj = {};
      lastMsgIdObj.topic = topic;
      var messagesObj = _readStorage(KEY_TYPE_CHAT_MESSAGES, topic);
      if (messagesObj) {
        localMessageList[topic] = messagesObj;
        lastMsgIdObj.lastMsgId = messagesObj[messagesObj.length -1].chatId;
      }
      lastMsgIdArr.push(lastMsgIdObj);
    }

    restParams.condition = JSON.stringify(lastMsgIdArr);
    restResource.chat.getListForSync(restParams, function(msgData) {
      $.each(msgData, function(idx, data) {
        var topic = data.topic;
        setLastReadMessageId(topic, data.lastMsgId);

        if (data.messageList && data.messageList.length > 0) {
          var messageArray = localMessageList[topic];
          if (!messageArray)
            messageArray = [];

          var unReadMsgCnt = 0;
          $.each(data.messageList, function(idx, msgRow) {
            if (data.lastMsgId < msgRow.chatId)
              unReadMsgCnt++;

            // LocalStorage 저장될 포맷으로 message Object 생성
            var message = {
              senderId: msgRow.senderId,
              chatId: msgRow.chatId,
              creTime: msgRow.creTime,
              msg: msgRow.msg
            };
            messageArray.push(message);
          });

          var messageArrayLength = messageArray.length;
          if (unReadMsgCnt < constants.COMMON_SEARCH_COUNT) {
            if (messageArrayLength > constants.COMMON_SEARCH_COUNT)
              _appendMessageArray(messageArray.slice(messageArrayLength - constants.COMMON_SEARCH_COUNT, messageArrayLength), topic); // 항상 최대 검색 갯수만 LocalStorage에 저장한다.
            else
              _appendMessageArray(messageArray, topic);
          } else {
            if (messageArrayLength > (constants.COMMON_SEARCH_COUNT + 5))
              _appendMessageArray(messageArray.slice(messageArrayLength - (constants.COMMON_SEARCH_COUNT + 5), messageArrayLength), topic); // unReadMsgCnt기준의 이전메시지 5개 이상정도 더 보여준다.
            else
              _appendMessageArray(messageArray, topic);
          }

          if (unReadMsgCnt > 0)
            setChattingAlarmCnt(topic, unReadMsgCnt);
        }
      });
      if (callback)
        callback();
    });

  }

  // Local Stroage 저장된 파일에서 과거 메시지 가져와 local storage에 저장
  function getPreviousChatMessage(topic, callback) {
    var restParams = {
      "teamId": loginInfo.teamId,
      "emplId": loginInfo.emplId,
      "topic": topic
    };

    var firstMsgId = firstMsgIdCache.get(topic);
    if (firstMsgId) {
      restParams.firstMsgId = firstMsgId;
    }

    restResource.chat.getListByCondition(restParams, {}, function(msgData) {
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
        keyName = "CHAT_" + loginInfo.emplId + "_" + topic;
        break;
      case KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID:
        keyName = "CHAT_LAST_READ_MESSAGE_ID_" + loginInfo.emplId;
        break;
    }
    return keyName;
  }

  function _writeStorage(keyType, value, topic) {
    storageManager.setValue(_getKeyName(keyType, topic), JSON.stringify(value));
  }

  function _readStorage(keyType, topic) {
    var value = storageManager.getValue(_getKeyName(keyType, topic));
    if (value)
      return JSON.parse(value);
    return null;
  }

  // 모든 메시지 가져오기
  function getAllChatMessage(topic) {
    var messages = messageCache.get(topic); // Memory에 value를 우선한다.
    if (messages)
      return messages;

    return _readStorage(KEY_TYPE_CHAT_MESSAGES, topic);
  }

  function appendMessageUnit(msgRow, topic) {
    var messages = getAllChatMessage(topic);
    if (!messages) {
      messages = [];
    }

    messages.push(msgRow);
    firstMsgIdCache.set(topic, msgRow.chatId);
    messageCache.set(topic, messages);
  }

  function _prependMessageArray(value, topic) {
    var messages = getAllChatMessage(topic);
    if (!messages)
      messages = [];

    firstMsgIdCache.set(topic, value[0].chatId);
    messageCache.set(topic, value.concat(messages));
  }

  function _appendMessageArray(value, topic) {
    firstMsgIdCache.set(topic, value[0].chatId);
    _writeStorage(KEY_TYPE_CHAT_MESSAGES, value, topic);
  }

  function setLastReadMessageId(topic, lastMsgId) {
    var lastReadMessageIdMap = _readStorage(KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID);
    if (!lastReadMessageIdMap)
      lastReadMessageIdMap = {};
    lastReadMessageIdMap[topic] = lastMsgId;
    _writeStorage(KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID, lastReadMessageIdMap);
  }

  function getLastReadMessageId(topic) {
    var lastReadMessageIdMap = _readStorage(KEY_TYPE_CHAT_LAST_READ_MESSAGE_ID);
    if (!lastReadMessageIdMap)
      return null;
    return lastReadMessageIdMap[topic];
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
