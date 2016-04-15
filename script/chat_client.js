var mqtt = require('mqtt');
var chat = (function() {
  var clientChatInfo = {};

  function configMyInfo(teamId, emplId) {
    if (!clientChatInfo.client || !clientChatInfo.client.connected) {
      clientChatInfo.teamId = teamId;
      clientChatInfo.emplId = emplId;

      console.info('teamId: %i, emplId: %i', teamId, emplId);

      if ((clientChatInfo.client = _createMQTTClient()) === null) {
        console.error("Failed to initialize MQTT client");
        return;
      }
    }
  }

  function _getTopicPrefix(topicType, parmas) {
    var addtionStr = "";
    switch (topicType) {
      case constants.TOPIC_MSG:
        var myTopic;
        if (parmas.chatType === constants.DIRECT_CHAT) {
          myTopic = "{peer}/" + parmas.topic;
        } else if (parmas.chatType === constants.CHANNEL_CHAT) {
          myTopic = parmas.topic;
          if (myTopic.startsWith(constants.CHANNEL_TOPIC_DELIMITER)) {
            myTopic = myTopic.substr(1, myTopic.length); // "#"은 mqtt의 wildcard로 제거
          }
        }

        addtionStr = "/" + parmas.chatType + "/" + myTopic;
      break;
      case constants.TOPIC_COMMAND:
        addtionStr = "/" + parmas.receiver;
      break;
    }

    return clientChatInfo.teamId + topicType + addtionStr;
  }

  function _createMQTTClient() {
    var options = {
      keepalive: 60,
      reconnectPeriod: 3000,
      connectTimeout: 30 * 1000,
      protocol: "wss",
      rejectUnauthorized: false
    };

    if (runningChannel === constants.CHANNEL_APP)
      options.rejectUnauthorized = false;

    var client = mqtt.connect(constants.MQTT_URL, options);
    client.on('connect', _mqttConnected);
    client.on('message', _mqttReceived);
    client.on('close', function(event) {
      if (event && event.type && event.type === 'error')
        toastr.error('You have invalid certificate. Please install valid certificate and restart browser. If not, you cannot send message.');
    });

    return client;
  }

  function subscribe(topic) {
    clientChatInfo.client.subscribe(topic);
  }

  function unsubscribe(topic) {
    clientChatInfo.client.unsubscribe(topic);
  }

  function _mqttConnected() {
    // topic array: presence, msg(direct, group)
    var topicArray = [constants.TOPIC_PRESENCE_ONLINE,
      constants.TOPIC_PRESENCE_OFFLINE,
      constants.TOPIC_PRESENCE_KEEPALIVE,
      clientChatInfo.teamId + constants.TOPIC_COMMAND + "/" + clientChatInfo.emplId,
      clientChatInfo.teamId + constants.TOPIC_MSG + "/" + constants.DIRECT_CHAT + "/" + clientChatInfo.emplId + "/+"
    ];

    var channelArray = channelCache.getValueArray();
    for (var key in channelArray) {
      topicArray.push(getChannelTopicName(channelArray[key].name));
    }

    console.log('_mqttConnected! topicArray:%s', topicArray.toString());
    subscribe(topicArray);

    _sendPresenceConnectionStatus(constants.TOPIC_PRESENCE_ONLINE, constants.PRESENCE_STATUS_ONLINE);
  }

  function _mqttReceived(topic, payload) {
    payload = JSON.parse(payload);
    var topicArray = topic.split('/');
    if (topicArray.length < 2) {
      console.error("Invalid topic format[%s], payload:%s", topic, payload);
      return;
    }

    var topicType = "/" + topicArray[1];
    switch (topicType) {
      case constants.TOPIC_MSG:
        if (topicArray.length < 4) {
          console.error("Invalid msg topic format[%s]", topic);
          return;
        }

        if (Number(topicArray[2]) === constants.CHANNEL_CHAT) {
          payload.topic = constants.CHANNEL_TOPIC_DELIMITER + topicArray[3];
        } else {
          payload.topic = topicArray[4];
        }

        if (payload.lastMsgId) {
          handleLastMsgId(payload);
        } else {
          handleMsg(payload);
        }

        break;
      case constants.TOPIC_PRESENCE:
        if (topic === constants.TOPIC_PRESENCE_ONLINE || topic === constants.TOPIC_PRESENCE_OFFLINE)
          setUserPresenceOnList(payload.emplId, payload.status);
        else if (topic === constants.TOPIC_PRESENCE_KEEPALIVE)
          chatModule.sendPresenceState();
        break;
      case constants.TOPIC_COMMAND:
        handleCommand(clientChatInfo.emplId, payload);
        break;
      default:
        console.error("Invalid topic format[%s]", topic);
    }
  }

  function _publishChattingMessage(data, params){
    var payload = {
      senderId: params.emplId,
      chatId: data.chatId,
      creTime: data.time,
      msg: params.msg
    };

    _publishMsg(params.topic, payload);
  }

  function _publishMsg(topic, payload) {
    var payloadStr = JSON.stringify(payload);
    var chatType = getChatType(topic);
    var prefixParmas = {
      "chatType" : chatType,
      "topic" : topic
    };

    var topicPrefix = _getTopicPrefix(constants.TOPIC_MSG, prefixParmas);
    if (chatType === constants.DIRECT_CHAT) {
      var topicEmplIds = topic.split("_");
      var receiverId;
      if (clientChatInfo.emplId == Number(topicEmplIds[0]))
        receiverId = Number(topicEmplIds[1]);
      else
        receiverId = Number(topicEmplIds[0]);

      clientChatInfo.client.publish(topicPrefix.replace("{peer}", receiverId), payloadStr); // 상대방 전송
      clientChatInfo.client.publish(topicPrefix.replace("{peer}", clientChatInfo.emplId), payloadStr); // 본인 전송
    } else {
      clientChatInfo.client.publish(topicPrefix, payloadStr); // msg 전송
    }
  }

  function _sendPresenceConnectionStatus(topic, presenceStatus) {
    var payload = {
      "emplId": clientChatInfo.emplId,
      "status" : presenceStatus
    };
    clientChatInfo.client.publish(topic, JSON.stringify(payload));
  }

  function sendCommand(receiver, commandPayload) {
    var topicPrefix = _getTopicPrefix(constants.TOPIC_COMMAND, {"receiver" : receiver});
    var commandPayloadStr = JSON.stringify(commandPayload);
    clientChatInfo.client.publish(topicPrefix, commandPayloadStr);
    console.log('sendCommand to the channel members [topic:%s, msg:%s]', topicPrefix, commandPayloadStr);
  }

  function sendPresenceState() {
    var payload = {
      "emplId": clientChatInfo.emplId
    };
    clientChatInfo.client.publish(constants.TOPIC_PRESENCE_STATE, JSON.stringify(payload));
  }

  function sendMsg(topic, msg) {
    // API 전송 성공 후 콜백함수에서 Publish 처리
    var params = {
      "teamId": clientChatInfo.teamId,
      "topic": topic,
      "emplId": clientChatInfo.emplId,
      "msg": msg
    };

    restResource.chat.postMsg(params, _publishChattingMessage);
  }

  function sendLastMsgId(topic, lastMsgId) {
    var payload = {
      "senderId": clientChatInfo.emplId,
      "lastMsgId": lastMsgId
    };

    _publishMsg(topic, payload);
  }

  function logoutPublish() {
    _sendPresenceConnectionStatus(constants.TOPIC_PRESENCE_OFFLINE, constants.PRESENCE_STATUS_OFFLINE);
  }

  function finalize() {
    clientChatInfo.client.end();
  }

  return {
    "configMyInfo": configMyInfo,
    "sendMsg": sendMsg,
    "sendCommand": sendCommand,
    "sendPresenceState": sendPresenceState,
    "sendLastMsgId" : sendLastMsgId,
    "subscribe" : subscribe,
    "unsubscribe" : unsubscribe,
    "logoutPublish" : logoutPublish,
    "finalize": finalize
  };
})();

module.exports = chat;
