'use strict';

var mqtt = require('mqtt');

var chat = (function() {
  var myInfo;
  var DIRECT_CHAT = 0;
  var GROUP_CHAT = 1;
  var TOPIC_SUB_POSTFIX = "/+"; // subscribe 시 postfix 추가하여 모든 클라이언트가 publish한 메시지 확인(client id 정보 확인 용도)

  var cache = (function() {
    var memory = {};

    function get(key) {
      if (typeof(memory[key]) !== 'undefined')
        return memory[key];

      return null;
    }

    function set(key, value) {
      memory[key] = value;

      console.log('cache_set[key:%s, value:%o]', key, value);
    }

    return {
      get: get,
      set: set
    };
  })();

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
      if (_initClient(DIRECT_CHAT, userList[i]) === null)
        console.error("Failed to initialize[%s]", userList[i]);
    }
  }

  function getTopic(connType, partid) {
    // topic format : {chat type}/{topic}
    // subscribe 시 : {topic format}/+
    // publish 시 : {topic_format}/{client id=emplid}
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
    var cachedKey = getTopic(connType, partid);
    console.log('cachedKey:%s', cachedKey);

    if (cachedKey !== null) {
      var client = cache.get(cachedKey);
      if (client === null) {
        client = _createClient(cachedKey);
        cache.set(cachedKey, client);
      }
      return client;
    } else
      return null;
  }

  function _mqttConnected() {
    console.log('_mqttConnected! topic:%s', this.topic);
    this.subscribe(this.topic + TOPIC_SUB_POSTFIX);
  }

  function _mqttReceived(topic, payload) {
    console.log('_mqttReceived topic:%s, msg:%s', topic, payload.toString());

    myInfo.recvCallback(myInfo.emplid, _generateMsgInfo(topic, payload));
  }

  function _generateMsgInfo(topic, payload) {
    // topic format : {chat type}/{topic}
    // direct 타입인 경우 포맷 : 0/{coid}/{peer1}_{peer2}/{publisher}
    // group 타입인 경우 포맷 : 1/{coid}/{group chat id}/{publisher}
    var topicArray = topic.split('/');
    if (topicArray.length < 4) {
      console.error("Invalid topic format[%s], payload:", topic, payload.toString());
      return;
    }

    var msgInfo = {};
    if (topicArray[0] === '0') {
      msgInfo.chatType = DIRECT_CHAT;
      var peerArray = topicArray[2].split('_');
      if (peerArray.length < 2) {
        console.error("Invalid peer info[%s]", topic);
        return;
      }
      msgInfo.peer1 = peerArray[0];
      msgInfo.peer2 = peerArray[1];
    } else {
      msgInfo.chatType = GROUP_CHAT;
      msgInfo.peer1 = topicArray[2];
      msgInfo.peer2 = topicArray[2];
    }
    msgInfo.coid = topicArray[1];
    msgInfo.publisher = topicArray[3];
    msgInfo.topic = topic;
    msgInfo.payload = payload;

    return msgInfo;
  }

  function sendDirectMsg(receiver, msg) {
    var client = _initClient(DIRECT_CHAT, receiver);
    client.publish(client.topic + "/" + myInfo.emplid, msg);

    console.log('sendDirectMsg topic:%s, msg:%s', client.topic, msg);
  }

  return {
    configMyInfo: configMyInfo,
    initClient: initClient,
    sendDirectMsg: sendDirectMsg,
    getTopic: getTopic
  };
})();

module.exports = chat;
