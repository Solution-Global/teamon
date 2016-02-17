'use strict';

var mqtt = require('mqtt');
var constants = require("./constants");

var chat = (function() {
  var myInfo;

  function configMyInfo(coid, emplid, loginid, recvCallback) {
    myInfo = {};
    myInfo.coid = coid;
    myInfo.emplid = emplid;
    myInfo.loginid = loginid;
    myInfo.recvCallback = recvCallback;

    console.log('coid:%i, emplid:%i, loginid:%s, recvCallback:%s', coid, emplid, loginid, recvCallback.name);

    if ((myInfo.client = _createMQTTClient()) === null) {
      console.error("Failed to initialize MQTT client");
      return;
    }
  }

  function _getMsgTopicPrefix(connType, partid) {
    var myTopic;
    if (connType === constants.DIRECT_CHAT) {
      myTopic = "{peer}/";
      if (myInfo.emplid < partid) {
        myTopic += myInfo.emplid + "_" + partid;
      } else {
        myTopic += partid + "_" + myInfo.emplid;
      }
    } else if (connType === constants.GROUP_CHAT) {
      myTopic = partid;
    } else {
      return null;
    }

    return myInfo.coid + constants.TOPIC_MSG + "/" + connType + "/" + myTopic;
  }

  function _getCommandTopicPrefix(receiver) {
    return myInfo.coid + constants.TOPIC_COMMAND + "/" + receiver;
  }

  function _createMQTTClient() {
    var options = {
      keepalive: 60,
      reconnectPeriod: 3000,
      connectTimeout: 30 * 1000,
    };

    var client = mqtt.connect(constants.MQTT_URL, options);
    client.on('connect', _mqttConnected);
    client.on('message', _mqttReceived);

    return client;
  }

  function _mqttConnected() {
    // topic array: presence, msg(direct, group)
    var topicArray = [myInfo.coid + constants.TOPIC_PRESENCE_ALL,
      myInfo.coid + constants.TOPIC_MSG + "/" + constants.DIRECT_CHAT + "/" + myInfo.emplid + "/+",
      myInfo.coid + constants.TOPIC_MSG + "/" + constants.GROUP_CHAT + "/+",
      myInfo.coid + constants.TOPIC_COMMAND + "/" + myInfo.emplid
    ];

    console.log('_mqttConnected! topicArray:%s', topicArray.toString());
    myInfo.client.subscribe(topicArray);

    // presence/online
    // myInfo.client.publish(myInfo.coid + constants.TOPIC_PRESENCE_ONLINE, myInfo.emplid.toString());
  }

  function _mqttReceived(topic, payload) {
    var payloadStr = payload.toString();
    console.log('_mqttReceived topic:%s, msg:%s', topic, payloadStr);
    myInfo.recvCallback(myInfo.emplid, topic, payloadStr);
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

    var receiver;
    if(params.chatType === constants.DIRECT_CHAT) {
      receiver = (params.spkrid === params.peer1) ? params.peer2 : params.peer1;
    } else {
      receiver = params.peer2;
    }
    var msgPayload = {
      chatType: params.chatType,
      coid: params.coId,
      publisher: params.spkrid,
      receiver: receiver,
      lastmsgid: data.lastmsgid,
      msgid: data.msgid,
      time: data.time,
      msg: params.msg
    };

    var msgPayloadStr = JSON.stringify(msgPayload);
    var topicPrefix = _getMsgTopicPrefix(params.chatType, receiver);
    if (topicPrefix !== null) {
      if (params.chatType === constants.DIRECT_CHAT) {
        // 상대방 토픽으로 전송
        var receiverTopic = topicPrefix.replace("{peer}", receiver);
        myInfo.client.publish(receiverTopic, msgPayloadStr);
        console.log('_publishMsg to the receiver [topic:%s, msg:%s]', receiverTopic, msgPayloadStr);

        // 자신의 토픽으로 전송
        var myTopic = topicPrefix.replace("{peer}", params.spkrid);
        myInfo.client.publish(myTopic, msgPayloadStr);
        console.log('_publishMsg to myself [topic:%s, msg:%s]', myTopic, msgPayloadStr);

      } else if (params.chatType === constants.GROUP_CHAT) {
        // 채팅방으로 토픽으로 전송
        myInfo.client.publish(topicPrefix, msgPayloadStr);
        console.log('_publishMsg to the channel members [topic:%s, msg:%s]', receiverTopic, msgPayloadStr);
      }
    }
  }

  function sendCommand(receiver, commandPayload) {
    var topicPrefix = _getCommandTopicPrefix(receiver);
    var commandPayloadStr = JSON.stringify(commandPayload);
    myInfo.client.publish(topicPrefix, commandPayloadStr);
    console.log('sendCommand to the channel members [topic:%s, msg:%s]', topicPrefix, commandPayloadStr);
  }

  function sendMsg(chatType, receiver, msg) {
    // API 전송 성공 후 콜백함수에서 Publish 처리
    var peer1, peer2;

    if(chatType === constants.DIRECT_CHAT) {
      peer1 = (myInfo.emplid < receiver) ? myInfo.emplid : receiver;
      peer2 = (myInfo.emplid < receiver) ? receiver : myInfo.emplid;
    } else {
      peer2 = receiver;
    }
    var params = {
      "coId": myInfo.coid,
      "chatType": chatType,
      "peer1": peer1,
      "peer2": peer2,
      "spkrid": myInfo.emplid,
      "msg": msg
    }

    restResourse.chat.postMsg(params, _publishMsg);
  }

  function finalize() {
    myInfo.client.end();
  }

  return {
    configMyInfo: configMyInfo,
    sendMsg: sendMsg,
    finalize: finalize,
    sendCommand: sendCommand
  };
})();

module.exports = chat;
