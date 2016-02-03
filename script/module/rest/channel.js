var constants = require("../constants");
var restCommon = require("./rest_common");

var Channel = (function() {
  this.restCommon = new restCommon();
  this.path = "/frontend/communication/channel";
});

Channel.prototype.getChannelList = function(params, callback) {
  var self = this;
  console.log("getListByCoid - [coId]" + params.coId + "[memberIncluded]" + params.memberIncluded);
  var args = {
    path: {
      "coId": params.coId
    },
    parameters: {
      "memberIncluded": params.memberIncluded === undefined ? false : params.memberIncluded
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/${coId}", args,
    function(data, response) {
      callback(data);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
}

Channel.prototype.createChannel = function(params, callback) {
  var self = this;
  console.log("createChannel - [coId]" + params.coId + "[name]" + params.name + "[members]" + params.members + "[pinupMessage]" + params.pinupMessage);
  var args = {
    data: $.param({
      "coId": params.coId,
      "name": params.name,
      "members": params.members.toString(),
      "pinupMessage": params.pinupMessage
    }),
    headers: self.restCommon.commonHeaders
  };

  self.restCommon.client.post(self.restCommon.apiurl + self.path, args,
    function(data, response) {
      callback(response, params);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
}

module.exports = Channel
