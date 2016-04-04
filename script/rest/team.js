var restCommon = require("./rest_common");

var Team = (function(params) {
  params.path = "frontend/user/Team";
  this.restCommon = new restCommon(params);
});

Team.prototype.addCommonHeader = function(configValues) {
  this.restCommon.setCommonHeader(configValues);
};

Team.prototype.getTeamByName = function(params, callback) {
  var self = this;
  console.log("getTeamByName - [name]" + params.name);
  var args = {
    path: {
      "name": params.name
    }
  };
  self.restCommon.get("/${name}", args, callback);
};

module.exports = Team;
