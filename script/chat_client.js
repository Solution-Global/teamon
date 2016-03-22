var mqtt = require('mqtt');
var chat = (function() {
  var clientChatInfo = {};

  function configMyInfo(teamId, emplId) {
    if(!clientChatInfo.client || !clientChatInfo.client.connected) {
      clientChatInfo.teamId = teamId;
      clientChatInfo.emplId = emplId;

      console.log('teamId:%i, emplId:%i ', teamId, emplId);

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

    var client = mqtt.connect(constants.MQTT_URL, options);
    client.on('connect', _mqttConnected);
    client.on('message', _mqttReceived);
    client.on('close', function(event) {
      if (event.type === 'error')
        toastr.error('You have invalid certificate. Please install valid certificate and restart browser. If not, you cannot send message.');
    });

    return client;
  }

  function _mqttConnected() {
    // topic array: presence, msg(direct, group)
    var topicArray = [constants.TOPIC_PRESENCE_ONLINE,
      constants.TOPIC_PRESENCE_OFFLINE,
      constants.TOPIC_PRESENCE_KEEPALIVE,
      clientChatInfo.teamId + constants.TOPIC_MSG + "/" + constants.DIRECT_CHAT + "/" + clientChatInfo.emplId + "/+",
      clientChatInfo.teamId + constants.TOPIC_MSG + "/" + constants.CHANNEL_CHAT + "/+",
      clientChatInfo.teamId + constants.TOPIC_COMMAND + "/" + clientChatInfo.emplId
    ];

    console.log('_mqttConnected! topicArray:%s', topicArray.toString());
    clientChatInfo.client.subscribe(topicArray);

    _sendPresenceConnectionStatus(constants.TOPIC_PRESENCE_ONLINE, constants.PRESENCE_STATUS_OFFLINE);
  }

  function _mqttReceived(topic, payload) {
    var payloadStr = payload.toString();
    console.log('_mqttReceived topic:%s, msg:%s', topic, payloadStr);

    var topicArray = topic.split('/');
    if (topicArray.length < 2) {
      console.error("Invalid topic format[%s], payload:%s", topic, payloadStr);
      return;
    }

    var topicType = "/" + topicArray[1];
    switch (topicType) {
      case constants.TOPIC_MSG:
        handleMsg(clientChatInfo.emplI, payloadStr);
        break;
      case constants.TOPIC_PRESENCE:
        if(topic === constants.TOPIC_PRESENCE_ONLINE || topic === constants.TOPIC_PRESENCE_OFFLINE)
          handleLoginPresence(payloadStr);
        else if(topic === constants.TOPIC_PRESENCE_KEEPALIVE)
          chatModule.sendPresenceState();
        break;
      case constants.TOPIC_COMMAND:
        handleCommand(clientChatInfo.emplI, payloadStr);
        break;
      default:
        console.error("Invalid topic format[%s], payload:", topic, payloadStr);
    }
  }

  function _publishMsg(data, params) {
    var msgPayload = {
      teamId: params.teamId,
      senderId: params.emplId,
      topic: params.topic,
      chatId: data.chatId,
      time: data.time,
      msg: params.msg
    };

    var msgPayloadStr = JSON.stringify(msgPayload);
    var chatType = getChatType(params.topic);
    var prefixParmas = {
      "chatType" : chatType,
      "topic" : params.topic
    };
    var topicPrefix = _getTopicPrefix(constants.TOPIC_MSG, prefixParmas);

    if (chatType === constants.DIRECT_CHAT) {
      var topicEmplIds = params.topic.split("_");
      var receiverId;
      if (params.emplId == Number(topicEmplIds[0]))
        receiverId = Number(topicEmplIds[1]);
      else
        receiverId = Number(topicEmplIds[0]);

      // 상대방 토픽으로 전송
      var receiverTopic = topicPrefix.replace("{peer}", receiverId);
      clientChatInfo.client.publish(receiverTopic, msgPayloadStr);

      // 자신의 토픽으로 전송
      var myTopic = topicPrefix.replace("{peer}", params.emplId);
      clientChatInfo.client.publish(myTopic, msgPayloadStr);

    } else if (chatType === constants.CHANNEL_CHAT) {
      // 채팅방으로 토픽으로 전송
      clientChatInfo.client.publish(topicPrefix, msgPayloadStr);
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

    restResourse.chat.postMsg(params, _publishMsg);
  }

  function finalize() {
    _sendPresenceConnectionStatus(constants.TOPIC_PRESENCE_OFFLINE, constants.PRESENCE_STATUS_OFFLINE);
    clientChatInfo.client.end();
  }

  return {
    "configMyInfo": configMyInfo,
    "sendMsg": sendMsg,
    "sendCommand": sendCommand,
    "sendPresenceState": sendPresenceState,
    "finalize": finalize
  };
})();

module.exports = chat;
