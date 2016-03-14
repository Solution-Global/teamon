var restCommon = require("./rest_common");

var CallHistory = (function(params) {
  params.path = "frontend/communication/callhistory";
  this.restCommon = new restCommon(params);
});

CallHistory.prototype.getListByCondition = function(params, callback) {
  var self = this;
  console.log("getListByCondition - [teamId]" + params.teamId + "[caller]" + params.caller + "[callee]" + params.callee);

  var parameters = {
    "caller": params.caller,
    "callee": params.callee,
    "limit": params.limit ? params.limit : constants.COMMON_SEARCH_COUNT,
    "offset": params.offset ? params.offset : constants.COMMON_SEARCH_OFFSET,
    "sIdx": params.sIdx ? params.sIdx : "callstart",
    "sOrder": params.sOrder ? params.sOrder : constants.COMMON_SEARCH_ORDER_DESC,
    "allowViceVersa": params.allowViceVersa ? params.allowViceVersa : "true"
  };
  // optional parameters (빈 문자열 전송 방지)
  if (params.beginDate) {
    parameters.beginDate = params.beginDate;
  }
  if (params.endDate) {
    parameters.endDate = params.endDate;
  }

  var args = {
    path: {
      "teamId": params.teamId
    },
    parameters: parameters
  };
  self.restCommon.get("/co/${teamId}", args, callback);
};

CallHistory.prototype.createCallHistory = function(params, callback) {
  var self = this;
  console.log("createCallHistory - [teamId]" + params.teamId + "[caller]" + params.caller + "[callee]" + params.callee);

  var parameters = {
    "teamId": params.teamId,
    "caller": params.caller,
    "callee": params.callee,
    "callStart": params.callStart,
    "callTime": params.callTime ? params.callTime : 0
  };
  // optional parameters (빈 문자열 전송 방지)
    if (params.memo) {
      parameters.memo = params.memo;
    }
    if (params.recFileId) {
      parameters.recFileId = params.recFileId;
    }

  var args = {
    data: $.param(parameters)
  };

  self.restCommon.post(null, args, callback);
};

CallHistory.prototype.updateCallHistory = function(params, callback) {
  var self = this;
  console.log("updateCallHistory - [callhid]" + params.callhid + "[memo]" + params.memo + "[callTime]" + params.callTime);

  var parameters = {
    "callTime": params.callTime ? params.callTime : 0
  };
  // optional parameters (빈 문자열 전송 방지)
  if (params.memo) {
    parameters.memo = params.memo;
  }
  if (params.recFileId) {
    parameters.recFileId = params.recFileId;
  }

  var args = {
    data: $.param(parameters)
  };
  self.restCommon.put("/" + params.callhid, args, callback);
};

CallHistory.prototype.getCallHistory = function(params, callback) {
  var self = this;
  console.log("getCallHistory - [callHistoryId]" + params.callHistoryId);
  var args = {
    path: {
      "callHistoryId": params.callHistoryId
    }
  };
  self.restCommon.get("/${callHistoryId}", args, callback);
};

module.exports = CallHistory;
