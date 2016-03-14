// By convention, we name a constructor function by capitalizing the first letter.
// Constructor functions should always be called with the new operator.
var RestCommon = require("./rest_common");

var Login = (function(params) {
  params.path ="frontend/user/login";
  this.restCommon = new RestCommon(params);
});

Login.prototype.login = function(params, callback) {
  var self = this;
  console.debug("login - [tea1m] " + params.team + "[email] " + params.email);
  var args = {
    path : {
      "team" : params.team,
      "email" : params.email
    },
    data: $.param({
      "password" : params.password,
      "client" : params.client
    })
  };
  self.restCommon.put("/${team}/${email}", args, callback);
};

Login.prototype.logout = function(emplId) {
  var self = this;
  console.log("logout - [emplId]" + emplId);
  var args = {
    path : {
      "emplId" : emplId
    }
  };
  self.restCommon.put("/${emplId}", args);
};

module.exports = Login;
