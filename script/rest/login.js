// By convention, we name a constructor function by capitalizing the first letter.
// Constructor functions should always be called with the new operator.
var RestCommon = require("./rest_common");

var Login = (function(params) {
  this.restCommon = new RestCommon(params);
  this.path ="/frontend/user/login";
});

Login.prototype.login = function(params, callback) {
  var self = this;
  console.log("login - [team]" + params.team + "[loginid]" + params.email);
  var args = {
    path : {
      "team" : params.team,
      "email" : params.email
    },
    data: $.param({
      "password" : params.password,
      "client" : params.client
    }),
    headers: self.restCommon.commonHeaders
  };

  self.restCommon.client.put(self.restCommon.apiurl + self.path + "/${team}/${email}", args,
    function(data, response){
      callback(data);
  }).on('error',function(err){
    console.error('something went wrong on the request', err.request.options);
  });
};

Login.prototype.logout = function(emplId) {
  var self = this;
  console.log("logout - [emplId]" + emplId);
  var args = {
    path : {
      "emplId" : emplId
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.put(self.restCommon.apiurl + self.path + "/${emplId}", args,
    function(data, response){
  });
};

module.exports = Login;
