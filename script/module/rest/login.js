var restCommon = require("./rest_common");

var Login = (function() {
  this.restCommon = new restCommon();
  this.path ="/frontend/user/login";
});

Login.prototype.login = function(params, callback) {
  var self = this;
  console.log("login - [company]" + params.company + "[loginid]" + params.loginId + "[password]" + params.password);
  var args = {
    path : {
      "company" : params.company,
      "loginId" : params.loginId
    },
    data: $.param({
      "password" : params.password,
      "jSession" : "Desktop",
      "hostIp" : "192.168.2.10",
      "port" : "3232",
      "client" : "junit test"
    }),
    headers: self.restCommon.commonHeaders
  };

  self.restCommon.client.put(self.restCommon.apiurl + self.path + "/${company}/${loginId}", args,
    function(data, response){
      callback(data);
  }).on('error',function(err){
    console.log('something went wrong on the request', err.request.options);
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

module.exports = Login
