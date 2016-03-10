var restCommon = require("./rest_common");

var Channel = (function(params) {
  this.restCommon = new restCommon(params);
  this.path = "/frontend/communication/channel";
});

Channel.prototype.getChannelList = function(params, callback) {
  var self = this;
  console.log("getChannelList - [teamId]" + params.teamId + "[memberIncluded]" + params.memberIncluded);
  var args = {
    path: {
      "teamId": params.teamId
    },
    parameters: {
      "memberIncluded": params.memberIncluded === undefined ? false : params.memberIncluded
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/${teamId}", args,
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

Channel.prototype.getChannelByName = function(params, callback) {
  var self = this;
  console.log("getChannelByName - [name]" + params.name + "[teamId]" + params.teamId + "[memberIncluded]" + params.memberIncluded);
  var args = {
    parameters: {
      "name": params.name,
      "teamId": params.teamId,
      "memberIncluded": params.memberIncluded === undefined ? false : params.memberIncluded
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/name", args,
    function(data, response) {
      callback(data, response);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

Channel.prototype.createChannel = function(params, callback) {
  var self = this;
  console.log("createChannel - [teamId]" + params.teamId + "[name]" + params.name + "[members]" + params.members + "[pinupMessage]" + params.pinupMessage);
  var args = {
    data: $.param({
      "teamId": params.teamId,
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

  self.restCommon.client.post(self.restCommon.apiurl + self.path + "/" + params.channelId + "/member", args,
    function(data, response) {
      callback(response, params);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
};

module.exports = Channel;
