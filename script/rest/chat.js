var restCommon = require("./rest_common");

var Chat = (function(params) {
  this.restCommon = new restCommon(params);
  this.path = "/frontend/communication/chat";
});

Chat.prototype.getListByCondition = function(params, callBackRequiredValues, callback) {
  var self = this;
  console.log("getListByCondition - [teamId]" + params.teamId + "[emplId]" + params.emplId + "[topic]" + params.topic + "[senderId]" + params.senderId + "[lastChatId]" + params.lastChatId + "[firstChatId]" + params.firstChatId);
  var args = {
    path: {
      "teamId": params.teamId,
      "emplId": params.emplId
    },
    parameters: {
      "topic": params.topic,
      "emplId": params.emplId,
      "senderId": params.senderId ? params.senderId : constants.COMMON_DB_NUMBER_NULL_STR,
      "lastChatId": params.lastChatId ? params.lastChatId : constants.COMMON_SEARCH_ALL,
      "firstChatId": params.firstChatId ? params.firstChatId : constants.COMMON_SEARCH_ALL,
      "msgCount": params.msgCount ? params.msgCount : constants.COMMON_SEARCH_COUNT
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/team/${teamId}/searchby/${emplId}", args,
    function(data, response) {
      callback(data, callBackRequiredValues);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

Chat.prototype.getMentionList = function(params, callback) {
  var self = this;
  console.log("getMentionList - [emplId]" + params.emplId);
  var args = {
    path: {
      "emplId": params.emplId
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/mention/${emplId}", args,
    function(data, response) {
      callback(data);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

Chat.prototype.postMsg = function(params, callback) {
  var self = this;
  console.log("postMsg - [teamId]" + params.teamId  + "[topic]" + params.topic + "[emplId]" + params.emplId + "[msg]" + params.msg);
  var args = {
    data: $.param({
      "teamId": params.teamId,
      "topic": params.topic,
      "emplId": params.emplId,
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
};

module.exports = Chat;
