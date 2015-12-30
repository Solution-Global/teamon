'use strict';

var mqtt = require('mqtt');
var Cache = require('./cache');

var chat = (function() {
  var myInfo;
  var DIRECT_CHAT = 0;
  var GROUP_CHAT = 1;
  var MSG_PUB_REQ_POSTFIX = "/pubreq"; // publish시에 topic 이하의 postfix 사용 -> ChatPublisher로 전달

  var clientCache = new Cache();

  function configMyInfo(coid, emplid, loginid, recvCallback) {
    myInfo = {};
    myInfo.coid = coid;
    myInfo.emplid = emplid;
    myInfo.loginid = loginid;
    myInfo.recvCallback = recvCallback;

    console.log('coid:%i, emplid:%i, loginid:%s, recvCallback:%s', coid, emplid, loginid, recvCallback.name);
  }

  function initClient(channelList, userList) {
    if (!myInfo) {
      console.error('Configure your info first!');
      return;
    }

    if (channelList.constructor !== Array || userList.constructor != Array) {
      console.error('Arguments should be Array.');
      return;
    }

    for (var i = 0, len = userList.length; i < len; i++) {
      if (userList[i] === myInfo.emplid) {
        continue;
      }

      if (_initClient(DIRECT_CHAT, userList[i]) === null) {
        console.error("Failed to initialize[%s]", userList[i]);
      }
    }
  }

  function _getTopic(connType, partid) {
    // topic format : {chat type}/{topic}
    // {chat type} : direct(0), group(1)
    // direct {topic} : {peer1 emplid)_{peer2 emplid}
    // group {topic} : {group channel id}
    var myTopic;
    if (connType === DIRECT_CHAT) {
      if (myInfo.emplid < partid)
        myTopic = myInfo.emplid + "_" + partid;
      else
        myTopic = partid + "_" + myInfo.emplid;
    } else if (connType === GROUP_CHAT) {
      myTopic = partid;
    } else {
      return null;
    }

    return connType + "/" + myInfo.coid + "/" + myTopic;
  }

  function _createClient(topic) {
    var client = mqtt.connect('mqtt://192.168.1.164:2883');
    client.topic = topic;
    client.on('connect', _mqttConnected);
    client.on('message', _mqttReceived);

    return client;
  }

  function _initClient(connType, partid) {
    // cachedKey : topic
    var cachedKey = _getTopic(connType, partid);
    if (cachedKey !== null) {
      var client = clientCache.get(cachedKey);
      if (client === null) {
        client = _createClient(cachedKey);
        clientCache.set(cachedKey, client);
      }
      return client;
    } else
      return null;
  }

  function _mqttConnected() {
    // topic array: topic (direct or group), topic/emplid (internal message)
    var topicArray = [this.topic, this.topic + "/" + myInfo.emplid];
    console.log('_mqttConnected! topicArray:%s', topicArray.toString());
    this.subscribe(topicArray);
  }

  function _mqttReceived(topic, payload) {
    console.log('_mqttReceived topic:%s, msg:%s', topic, payload.toString());
    myInfo.recvCallback(myInfo.emplid, payload.toString());
  }

  function _generateMsgPayloadStr(chatType, receiver, msg) {
    /*
      msgPayload = {
        chatType:  // 채팅 타입 (client 담당)
        publisher: // 메시지 발신자 (client 담당)
        receiver:  // 메시지 수신자, direct인 경우 peer id, group인 경우 group chat id (client 담당)
        msgid:     // DB 저장될 msg id. (pubreq 담당)
        time:      // 메시지 발신 시간 (pubreq 담당)
        msg:       // 발신 메시지 (client 담당)
      }
    */
    var msgPayload = {
      chatType: chatType,
      publisher: myInfo.emplid,
      receiver: receiver,
      msg: msg
    };

    return JSON.stringify(msgPayload);
  }

  function sendDirectMsg(receiver, msg) {
    var client = _initClient(DIRECT_CHAT, receiver);
    var msgPayloadStr = _generateMsgPayloadStr(DIRECT_CHAT, receiver, msg);
    client.publish(client.topic + MSG_PUB_REQ_POSTFIX, msgPayloadStr);

    console.log('sendDirectMsg topic:%s, msg:%s', client.topic, msgPayloadStr);
  }

  return {
    configMyInfo: configMyInfo,
    initClient: initClient,
    sendDirectMsg: sendDirectMsg
  };
})();

module.exports = chat;
