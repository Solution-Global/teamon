// By convention, we name a constructor function by capitalizing the first letter.
// Constructor functions should always be called with the new operator.
var RestCommon = require("./rest_common");

var Login = (function(params) {
  params.path ="frontend/user/login";
  this.restCommon = new RestCommon(params);
});

Login.prototype.addCommonHeader = function(configValues) {
  this.restCommon.setCommonHeader(configValues);
};

Login.prototype.login = function(params, callback) {
  var self = this;
  console.debug("login - [team] " + params.team + "[email] " + params.email);
  var args = {
    path : {
      "team" : params.team,
      "email" : params.email
    },
    data: $.param({
      password : params.password,
      os: params.os,
      browser: params.browser,
      device: params.device
    })
  };
  self.restCommon.put("/${team}/${email}", args, callback);
};

Login.prototype.loggedIn = function(params, callback) {
  var self = this;
  var args = {
    path: {
      "emplId": params.emplId,
    },
    data: $.param({
      "os": params.os,
      "browser": params.browser,
      "device": params.device
    })
  };

  self.restCommon.put("/loggedIn/${emplId}", args, callback);
};

Login.prototype.logout = function(params, callback) {
  var self = this;
  var args = {
    path: {
      "emplId": params.emplId,
    },
    data: $.param({
      "os": params.os,
      "browser": params.browser,
      "device": params.device
    })
  };

  self.restCommon.put("/logout/${emplId}", args, callback);
};

Login.prototype.getLoggedInEmplListByTeamId = function(params, callback) {
  var self = this;
  console.log("getLoggedInEmplListByTeamId - [teamId]" + params.teamId);
  var args = {
    path: {
      "teamId": params.teamId
    }
  };
  self.restCommon.get( "/team/${teamId}", args, callback);
};

module.exports = Login;
