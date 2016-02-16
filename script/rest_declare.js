// By convention, we name a constructor function by capitalizing the first letter.
// Constructor functions should always be called with the new operator.
var EmplRes = require("../script/module/rest/empl");
var LoginRes = require("../script/module/rest/login");
var ChatRes = require("../script/module/rest/chat");
var ChannelRes = require("../script/module/rest/channel");
var CallHistoryRes = require("../script/module/rest/call_history");

var restResourse = {
  empl : new EmplRes(),
  login : new LoginRes(),
  chat : new ChatRes(),
  channel : new ChannelRes(),
  callHistory : new CallHistoryRes()
};
