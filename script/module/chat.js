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

  function _getTopic(connType, partid) {
    var myTopic;
    if (connType === constants.DIRECT_CHAT) {
      if (myInfo.emplid < partid) {
        myTopic = myInfo.emplid + "_" + partid;
      } else {
        myTopic = partid + "_" + myInfo.emplid;
      }
    } else if (connType === constants.GROUP_CHAT) {
      myTopic = partid;
    } else {
      return null;
    }

    return myInfo.coid + constants.TOPIC_MSG + "/" + connType + "/" + myTopic;
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
    // topic array: presence, msg, {publisher}
    var topicArray = [myInfo.coid + constants.TOPIC_PRESENCE_ALL,
      myInfo.coid + constants.TOPIC_MSG + "/+/+",
      myInfo.coid + constants.TOPIC_MSG + "/+/+/" + myInfo.emplid
    ];
    console.log('_mqttConnected! topicArray:%s', topicArray.toString());
    myInfo.client.subscribe(topicArray);

    // presence/online
    myInfo.client.publish(myInfo.coid + constants.TOPIC_PRESENCE_ONLINE, myInfo.emplid.toString());
  }

  function _mqttReceived(topic, payload) {
    var payloadStr = payload.toString();
    // TODO 자신과 관련없는 토픽은 전달되지 않도록 수정 필요 (임시코드)
    var topicArray = topic.split('/');
    var chatType = parseInt(topicArray[2]);
    if (chatType === constants.DIRECT_CHAT) {
      var peers = topicArray[3].split('_');
      if (!peers.includes(myInfo.emplid.toString())) {
        return;
      }
    }

    console.log('_mqttReceived topic:%s, msg:%s', topic, payloadStr);
    myInfo.recvCallback(myInfo.emplid, topic, payloadStr);
  }

  function _generateMsgPayloadStr(chatType, receiver, msg) {
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
      chatType: chatType,
      coid: myInfo.coid,
      publisher: myInfo.emplid,
      receiver: receiver,
      msg: msg
    };

    return JSON.stringify(msgPayload);
  }

  function sendDirectMsg(receiver, msg) {
    var topic = _getTopic(constants.DIRECT_CHAT, receiver) + constants.TOPIC_PUBREQ;
    var msgPayloadStr = _generateMsgPayloadStr(constants.DIRECT_CHAT, receiver, msg);
    myInfo.client.publish(topic, msgPayloadStr);

    console.log('sendDirectMsg topic:%s, msg:%s', topic, msgPayloadStr);
  }

  return {
    configMyInfo: configMyInfo,
    sendDirectMsg: sendDirectMsg
  };
})();

module.exports = chat;
