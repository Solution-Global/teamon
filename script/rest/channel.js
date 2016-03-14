var restCommon = require("./rest_common");

var Channel = (function(params) {
  params.path = "frontend/communication/channel";
  this.restCommon = new restCommon(params);
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
    }
  };
  self.restCommon.get("/${teamId}", args, callback);
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
    }
  };
  self.restCommon.get( "/channel/${channelId}", args, callback);
};

Channel.prototype.getChannelByName = function(params, callback) {
  var self = this;
  console.log("getChannelByName - [name]" + params.name + "[teamId]" + params.teamId + "[memberIncluded]" + params.memberIncluded);
  var args = {
    parameters: {
      "name": params.name,
      "teamId": params.teamId,
      "memberIncluded": params.memberIncluded === undefined ? false : params.memberIncluded
    }
  };
  self.restCommon.get( "/name", args, callback);
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
    })
  };

  self.restCommon.post(null, args, callback);
};

Channel.prototype.addMember = function(params, callback) {
  var self = this;
  console.log("addMember - [channelId]" + params.channelId + "[members]" + params.members);
  var args = {
    data: $.param({
      "members": params.members.toString()
    })
  };

  self.restCommon.put( "/" + params.channelId + "/member", args, callback);
};

Channel.prototype.removeMember = function(params, callback) {
  var self = this;
  console.log("removeMember - [channelId]" + params.channelId + "[members]" + params.members);
  var args = {
    data: $.param({
      "members": params.members.toString()
    })
  };

  self.restCommon.post( "/" + params.channelId + "/member", args, callback);
};

module.exports = Channel;
