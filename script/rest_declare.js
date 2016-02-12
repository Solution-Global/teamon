var emplResource = require("../script/module/rest/empl");
var loginResource = require("../script/module/rest/login");
var chatResource = require("../script/module/rest/chat");
var channelResource = require("../script/module/rest/channel");
var companyResource = require("../script/module/rest/company");

var restResourse = {
  empl : new emplResource(),
  login : new loginResource(),
  chat : new chatResource(),
  channel : new channelResource(),
  company : new companyResource()
};
