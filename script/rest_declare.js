var emplResource = require("../script/module/rest/empl");
var loginResource = require("../script/module/rest/login");
var chatResource = require("../script/module/rest/chat");

var restResourse = {
  empl : new emplResource(),
  login : new loginResource(),
  chat : new chatResource(),
};
