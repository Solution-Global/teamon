var constants = require("../constants");
var restCommon = require("./rest_common");

var Company = (function() {
  this.restCommon = new restCommon();
  this.path = "/frontend/user/company";
});

Company.prototype.getCompanyByName = function(params, callback) {
  var self = this;
  console.log("getCompanyByName - [name]" + params.name);
  var args = {
    path: {
      "name": params.name
    },
    headers: self.restCommon.commonHeaders
  };
  self.restCommon.client.get(self.restCommon.apiurl + self.path + "/${name}", args,
    function(data, response) {
      callback(data, response);
    }).on('error', function(err) {
    console.error('something went wrong on the request', err.request.options);
  });
}

module.exports = Company
