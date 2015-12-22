'use strict';

var mqtt = require('mqtt');

var chat = (function() {
  var myInfo;
  var DIRECT_CHAT = 0;
  var GROUP_CHAT = 1;
  var DIRECT_TOPIC_PREIFX = "direct";
  var GROUP_TOPIC_PREFIX = "group";
  var TOPIC_SUB_POSTFIX = "/+";   // subscribe 시 postfix 추가하여 모든 클라이언트가 publish한 메시지 확인(client id 정보 확인 용도)

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

    console.log('coid:%i, emplid:%i, loginid:%s, myInfo:%o, recvCallback:%o', coid, emplid, loginid, myInfo);
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

  function _getTopic(connType, partid) {
    // topic format : {chat type}/{topic}
    // subscribe 시 : {topic format}/+
    // publish 시 : {topic_format}/{client id=emplid}
    if (connType === DIRECT_CHAT) {
      var myTopic;
      if (myInfo.emplid < partid)
        myTopic = myInfo.emplid + "_" + partid;
      else
        myTopic = partid + "_" + myInfo.emplid;
      return DIRECT_TOPIC_PREIFX + "/" + myInfo.coid + "/" + myTopic;
    } else if (connType === GROUP_CHAT)
      return GROUP_TOPIC_PREIFX + "/" + myInfo.coid + "/" + partid;
    else
      return null;
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

  function _mqttReceived(topic, message) {
    console.log('_mqttReceived topic:%s, msg:%s', topic, message.toString());

    myInfo.recvCallback("/" + myInfo.emplid, topic, message.toString());
  }

  function sendDirectMsg(receiver, msg) {
    var client = _initClient(DIRECT_CHAT, receiver);
    client.publish(client.topic + "/" + myInfo.emplid, msg);

    console.log('sendDirectMsg topic:%s, msg:%s', client.topic, msg);
  }

  function registerRecvCallback(recvCallback) {
    myInfo.recvCallback = recvCallback;
    console.log('recvCallback:%o', recvCallback);
  }

  return {
    configMyInfo: configMyInfo,
    initClient: initClient,
    sendDirectMsg: sendDirectMsg,
    registerRecvCallback: registerRecvCallback
  };
})();

module.exports = chat;
