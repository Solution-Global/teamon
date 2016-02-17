var constants = require("../constants");
var restCommon = require("./rest_common");

var CallHistory = (function() {
  this.restCommon = new restCommon();
  this.path = "/frontend/communication/callhistory";
});

CallHistory.prototype.getListByCondition = function(params, callback) {
  var self = this;
  console.log("getListByCondition - [coId]" + params.coId + "[caller]" + params.caller + "[callee]" + params.callee);
  var args = {
    path: {
      "coId": params.coId
    },
    parameters: {
      "caller": params.caller,
      "callee": params.callee,
      "beginDate": params.beginDate ? params.beginDate : "",
      "endDate": params.endDate ? params.endDate : "",
      "limit": params.limit ? params.limit : constants.COMMON_SEARCH_COUNT,
      "offset": params.offset ? params.offset : constants.COMMON_SEARCH_OFFSET,
      "sIdx": params.sIdx ? params.sIdx : "callstart",
      "sOrder": params.sOrder ? params.sOrder : constants.COMMON_SEARCH_ORDER_DESC
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/co/${coId}", args,
    function(data, response) {
      callback(data);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
}

CallHistory.prototype.createCallHistory = function(params) {
  var self = this;
  console.log("createCallHistory - [coId]" + params.coId + "[caller]" + params.caller + "[callee]" + params.callee);
  var args = {
    data: $.param({
      "coId": params.coId,
      "caller": params.caller,
      "callee": params.callee,
      "memo": params.memo ? params.memo : "",
      "recFileId": params.recFileId ? params.recFileId : "",
      "callStart": params.callStart,
      "callTime": params.callTime ? params.callTime : 0
    }),
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.post(self.restCommon.apiurl + self.path, args,
    function(data, response) {
      // do nothing;
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
}

module.exports = CallHistory
