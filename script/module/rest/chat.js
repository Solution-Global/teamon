var constants = require("../constants");
var restCommon = require("./rest_common");

var Chat = (function() {
  this.restCommon = new restCommon();
  this.path = "/frontend/communication/chat";
});

Chat.prototype.getListByPeers = function(params, callBackRequiredValues, callback) {
  var self = this;
  console.log("getListByCoid - [coId]" + params.coId + "[chatType]" + params.chatType + "[peer1]" + params.peer1 + "[peer2]" + params.peer2 + "[lastMsgId]" + params.lastMsgId + "[firstMsgId]" + params.firstMsgId);
  var args = {
    path: {
      "coId": params.coId
    },
    parameters: {
      "chatType": params.chatType,
      "peer1": params.peer1 ? params.peer1 : constants.COMMON_SEARCH_ALL,
      "peer2": params.peer2,
      "lastMsgId": params.lastMsgId ? params.lastMsgId : constants.COMMON_SEARCH_ALL,
      "firstMsgId": params.firstMsgId ? params.firstMsgId : constants.COMMON_SEARCH_ALL,
      "msgCount": params.msgCount ? params.msgCount : constants.COMMON_SEARCH_COUNT
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/co/${coId}", args,
    function(data, response) {
      callback(data, callBackRequiredValues);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
}

Chat.prototype.postMsg = function(params, callback) {
  var self = this;
  console.log("postMsg - [coId]" + params.coId + "[chatType]" + params.chatType + "[peer1]" + params.peer1 + "[peer2]" + params.peer2 + "[spkrid]" + params.spkrid + "[msg]" + params.msg);
  var args = {
    data: $.param({
      "coId": params.coId,
      "chatType": params.chatType,
      "peer1": params.peer1 ? params.peer1 : constants.COMMON_SEARCH_ALL,
      "peer2": params.peer2,
      "spkrid": params.spkrid,
      "msg": params.msg
    }),
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.post(self.restCommon.apiurl + self.path, args,
    function(data, response) {
      callback(data, params);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
}

module.exports = Chat
