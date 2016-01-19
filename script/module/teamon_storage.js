'use strict';

var LZString = require('lz-string');
var constants = require("./constants");

var teamonStorage = (function() {
    const KEY_TYPE_CHAT_MESSAGES = 1;
    const KEY_TYPE_CHAT_LAST_MESSAGES_ID = 2;
    var activeEmplId;

    function _getKeyName(keyType, params) {
      var keyName;
      switch (keyType) {
        case KEY_TYPE_CHAT_MESSAGES:
          keyName =  "CHAT_" +  params.chatType + "_" + activeEmplId + "_" + params.targetEmplId;
        break;
        case KEY_TYPE_CHAT_LAST_MESSAGES_ID:
          keyName =  "CHAT_LASTMSGID_" +  params.chatType + "_" + activeEmplId + "_" + params.targetEmplId;
        break;
      }
      return keyName;
    }

    function _getValue(key) {
      if (typeof key !== 'string') {
        console.error('Miss the key!');
        return;
      }

      var value = localStorage.getItem(key);
      console.log("[key-" + key+ "]" + value);

      if (value != null)
        value = LZString.decompress(value);

        console.log("[key-" + key+ "]" + value);

      if (value === "undefined") {
        return undefined;
      }

      if (value === "null") {
        return null;
      }

      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      return value;
    }

    function _setValue(key, value) {
      if (typeof key !== 'string') {
        console.error('Miss the key!');
        return;
      }

      localStorage.setItem(key, LZString.compress(value+""));
      //localStorage.setItem(key, value);
    }

    function _setChatLastMessageId(value, params) {
      var keyName = _getKeyName(KEY_TYPE_CHAT_LAST_MESSAGES_ID, params);
      _setValue(keyName, value);
    }

    function _getChatLastMessageId(chatType, targetEmplId) {
      var params = {"chatType" : chatType,  "targetEmplId" : targetEmplId };
      var keyName = _getKeyName(KEY_TYPE_CHAT_LAST_MESSAGES_ID, params);
      return _getValue(keyName);
    }

    function getChatMessage(chatType, targetEmplId) {
      var params = {"chatType" : chatType,  "targetEmplId" : targetEmplId };
      var keyName = _getKeyName(KEY_TYPE_CHAT_MESSAGES, params);

      var value = _getValue(keyName);
      if (value) {
        var jsonFormmetMessages = "{\"msg\":[" +  value + "]}";
        var messageArray  = JSON.parse(jsonFormmetMessages);
        return messageArray
      }
    }

    function appendChatMessage(value, chatType, targetEmplId) {
      var params = {"chatType" : chatType,  "targetEmplId" : targetEmplId };
      var keyName = _getKeyName(KEY_TYPE_CHAT_MESSAGES, params);

      var storredMessages = _getValue(keyName);
      if(storredMessages) {
        storredMessages = storredMessages + ("," + JSON.stringify(value));
      } else {
        storredMessages = JSON.stringify(value);
      }

      _setValue(keyName, storredMessages);
      _setChatLastMessageId(value.msgId, params);
    }

    // 서버에 저장된 message와 LocalDB sync, 처음 login시 한번 실행
    function syncChatMessage(loginUser) {
      activeEmplId = loginUser.emplId;
      restResourse.empl.getListByCoid({ "coId": loginUser.coId }, function(emplData) {
        if (emplData.rows.length > 0) {
          $.each(emplData.rows, function(idx, emplRow) {
            var params = {
              "peer1": Math.min.apply(null, [activeEmplId, emplRow.emplId]),
              "peer2": Math.max.apply(null, [activeEmplId, emplRow.emplId])
            };

            var lastMsgId = _getChatLastMessageId(constants.DIRECT_CHAT, emplRow.emplId);
            if(lastMsgId) {
              params.lastMsgId = lastMsgId;
            }

            restResourse.chat.getListByPeers(params, function(msgData) {
              if (msgData.length > 0) {
                $.each(msgData, function(idx, msgRow) {
                  var sendMode =  loginUser.emplId === msgRow.spkrId;
                  var sender = sendMode ? loginUser.loginId : emplRow.loginId;
                  var imgIdx = (msgRow.spkrId * 1) % 10;

                  var msgData = {
                      "msgId": msgRow.dcId,
                      "mode": sendMode ? "send" : "receive", // send or receive
                      "img": "../img/profile_img" + imgIdx + ".jpg",
                      "imgAlt": sender,
                      "sender": sender,
                      "msgText": msgRow.msg,
                      "time": new Date(msgRow.creTime).format("a/p hh mm")
                  };

                  appendChatMessage(msgData, constants.DIRECT_CHAT, emplRow.emplId);
                });
              }
            });
          });
        }
      });
    }

    function getPerference(key) {
      return _getValue(key);
    }

    function setPerference(key, value) {
      return _setValue(key, value);
    }

    return {
      syncChatMessage: syncChatMessage,
      getChatMessage: getChatMessage,
      appendChatMessage: appendChatMessage,
      setPerference: setPerference,
      getPerference: getPerference
    };
})();

module.exports = teamonStorage;
