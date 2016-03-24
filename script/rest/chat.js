var restCommon = require("./rest_common");

var Chat = (function(params) {
  params.path = "frontend/communication/chat";
  this.restCommon = new restCommon(params);
});

Chat.prototype.getListByCondition = function(params, callBackRequiredValues, callback) {
  var self = this;
  console.log("getListByCondition - [teamId]" + params.teamId + "[emplId]" + params.emplId + "[topic]" + params.topic + "[senderId]" + params.senderId + "[lastMsgId]" + params.lastMsgId + "[firstMsgId]" + params.firstMsgId);
  var args = {
    path: {
      "teamId": params.teamId,
      "emplId": params.emplId
    },
    parameters: {
      "topic": params.topic,
      "emplId": params.emplId,
      "senderId": params.senderId ? params.senderId : constants.COMMON_DB_NUMBER_NULL_STR,
      "lastMsgId": params.lastMsgId ? params.lastMsgId : constants.COMMON_SEARCH_ALL,
      "firstMsgId": params.firstMsgId ? params.firstMsgId : constants.COMMON_SEARCH_ALL,
      "msgCount": params.msgCount ? params.msgCount : constants.COMMON_SEARCH_COUNT
    }
  };
  self.restCommon.get( "/team/${teamId}/searchby/${emplId}", args, callback, callBackRequiredValues);
};

Chat.prototype.getMentionList = function(params, callback) {
  var self = this;
  console.log("getMentionList - [emplId]" + params.emplId);
  var args = {
    path: {
      "emplId": params.emplId
    }
  };
  self.restCommon.get( "/mention/${emplId}", args, callback);
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
    })
  };
  self.restCommon.post(self.restCommon.apiurl + self.path, args, callback, params);
};

module.exports = Chat;
