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
};

Channel.prototype.getChannel = function(params, callback) {
  var self = this;
  console.log("getChannel - [channelId]" + params.channelId + "[memberIncluded]" + params.memberIncluded);
  var args = {
    path: {
      "channelId": params.channelId
    },
    parameters: {
      "memberIncluded": params.memberIncluded === undefined ? false : params.memberIncluded
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/channel/${channelId}", args,
    function(data, response) {
      callback(data, response);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

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
      callback(data, response);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

Channel.prototype.addMember = function(params, callback) {
  var self = this;
  console.log("addMember - [channelId]" + params.channelId + "[members]" + params.members);
  var args = {
    data: $.param({
      "members": params.members.toString()
    }),
    headers: self.restCommon.commonHeaders
  };

  self.restCommon.client.put(self.restCommon.apiurl + self.path + "/" + params.channelId + "/member", args,
    function(data, response) {
      callback(response, params);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

Channel.prototype.removeMember = function(params, callback) {
  var self = this;
  console.log("removeMember - [channelId]" + params.channelId + "[members]" + params.members);
  var args = {
    data: $.param({
      "members": params.members.toString()
    }),
    headers: self.restCommon.commonHeaders
  };

  self.restCommon.client.delete(self.restCommon.apiurl + self.path + "/" + params.channelId + "/member", args,
    function(data, response) {
      callback(response, params);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

module.exports = Channel;
