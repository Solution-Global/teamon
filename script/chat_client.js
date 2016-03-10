var mqtt = require('mqtt');
var chat = (function() {
  var clientChatInfo = {};

  function configMyInfo(teamId, emplId, recvCallback) {
    if(!clientChatInfo.client || !clientChatInfo.client.connected) {
      clientChatInfo.teamId = teamId;
      clientChatInfo.emplId = emplId;
      clientChatInfo.recvCallback = recvCallback;

      console.log('teamId:%i, emplId:%i, recvCallback:%s', teamId, emplId, recvCallback.name);

    if (!clientChatInfo.client) {
      if ((clientChatInfo.client = _createMQTTClient()) === null) {
        console.error("Failed to initialize MQTT client");
        return;
      }
    }
  }

  function _getMsgTopicPrefix(connType, topic) {
    var myTopic;
    if (connType === constants.DIRECT_CHAT) {
      myTopic = "{peer}/" + topic;
    } else if (connType === constants.CHANNEL_CHAT) {
      myTopic = topic;
    }

    return clientChatInfo.teamId + constants.TOPIC_MSG + "/" + connType + "/" + myTopic;
  }

  function _getCommandTopicPrefix(receiver) {
    return clientChatInfo.teamId + constants.TOPIC_COMMAND + "/" + receiver;
  }

  function _createMQTTClient() {
    var options = {
      keepalive: 60,
      reconnectPeriod: 3000,
      connectTimeout: 30 * 1000,
<<<<<<< HEAD
      protocol: "wss"
=======
      protocol:"wss"
>>>>>>> 33607126619c18e590245c13da25565e36764f02
    };

    var client = mqtt.connect(constants.MQTT_URL, options);
    client.on('connect', _mqttConnected);
    client.on('message', _mqttReceived);

    return client;
  }

  function _mqttConnected() {
    // topic array: presence, msg(direct, group)
    var topicArray = [clientChatInfo.teamId + constants.TOPIC_PRESENCE_ALL,
      clientChatInfo.teamId + constants.TOPIC_MSG + "/" + constants.DIRECT_CHAT + "/" + clientChatInfo.emplId + "/+",
      clientChatInfo.teamId + constants.TOPIC_MSG + "/" + constants.CHANNEL_CHAT + "/+",
      clientChatInfo.teamId + constants.TOPIC_COMMAND + "/" + clientChatInfo.emplId
    ];

    console.log('_mqttConnected! topicArray:%s', topicArray.toString());
    clientChatInfo.client.subscribe(topicArray);

    // presence/online
    // clientChatInfo.client.publish(clientChatInfo.teamId + constants.TOPIC_PRESENCE_ONLINE, clientChatInfo.emplId.toString());
  }

  function _mqttReceived(topic, payload) {
    var payloadStr = payload.toString();
    console.log('_mqttReceived topic:%s, msg:%s', topic, payloadStr);
    clientChatInfo.recvCallback(clientChatInfo.emplId, topic, payloadStr);
  }

  function _publishMsg(data, params) {
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
    var topicPrefix = _getMsgTopicPrefix(chatType, params.topic);

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

  function sendCommand(receiver, commandPayload) {
    var topicPrefix = _getCommandTopicPrefix(receiver);
    var commandPayloadStr = JSON.stringify(commandPayload);
    clientChatInfo.client.publish(topicPrefix, commandPayloadStr);
    console.log('sendCommand to the channel members [topic:%s, msg:%s]', topicPrefix, commandPayloadStr);
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
    clientChatInfo.client.end();
  }

  return {
    configMyInfo: configMyInfo,
    sendMsg: sendMsg,
    finalize: finalize,
    sendCommand: sendCommand
  };
})();

module.exports = chat;
