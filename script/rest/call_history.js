var restCommon = require("./rest_common");

var CallHistory = (function(params) {
  this.restCommon = new restCommon(params);
  this.path = "/frontend/communication/callhistory";
});

CallHistory.prototype.getListByCondition = function(params, callback) {
  var self = this;
  console.log("getListByCondition - [coId]" + params.coId + "[caller]" + params.caller + "[callee]" + params.callee);

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
      "coId": params.coId
    },
    parameters: parameters,
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/co/${coId}", args,
    function(data, response) {
      callback(data);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

CallHistory.prototype.createCallHistory = function(params, callback) {
  var self = this;
  console.log("createCallHistory - [coId]" + params.coId + "[caller]" + params.caller + "[callee]" + params.callee);

  var parameters = {
    "coId": params.coId,
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
    data: $.param(parameters),
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.post(self.restCommon.apiurl + self.path, args,
    function(data, response) {
      callback(data);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
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
    data: $.param(parameters),
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.put(self.restCommon.apiurl + self.path + "/" + params.callhid, args,
    function(data, response) {
      callback(data);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

CallHistory.prototype.getCallHistory = function(params, callback) {
  var self = this;
  console.log("getCallHistory - [callHistoryId]" + params.callHistoryId);
  var args = {
    path: {
      "callHistoryId": params.callHistoryId
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/${callHistoryId}", args,
    function(data, response) {
      callback(data, response);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

module.exports = CallHistory;
