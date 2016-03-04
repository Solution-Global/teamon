// By convention, we name a constructor function by capitalizing the first letter.
// Constructor functions should always be called with the new operator.
var RestCommon = require("./rest_common");

var Empl = (function() {
  this.restCommon = new RestCommon();
  this.path ="/frontend/user/employee";
});

Empl.prototype.getListByCoid = function(params, callback) {
  var self = this;
    console.log("getListByCoid - [coId]" + params.coId + "[limit]" + params.limit + "[offset]" + params.offset + "[sIdx]" + params.sIdx + "[sOrder]" + params.sOrder);
    var args = {
      path : {
        "coId" : params.coId
      },
      parameters : {
        "limit" : params.limit ? params.limit : constants.COMMON_SEARCH_COUNT,
        "offset" : params.offset ? params.offset : constants.COMMON_SEARCH_OFFSET,
        "sIdx" : params.sIdx ? params.sIdx : "loginid",
        "sOrder" : params.sOrder ? params.sOrder : constants.COMMON_SEARCH_ORDER_ASC
      },
      headers: self.restCommon.commonHeaders
    };
    self.restCommon.client.get(self.restCommon.apiurl + self.path + "/co/${coId}", args,
      function(data, response){
        callback(data);
    }).on('error',function(err){
      console.error('something went wrong on the request', err.request.options);
    });
  };

  Empl.prototype.createEmpl = function(params, callback) {
    var self = this;
    console.log("createEmpl - [company]" + params.company + "[loginId]" + params.loginId + "[name]" + params.name + "[dept]" + params.dept + "[mobile]" + params.mobile  + "[office]" + params.office);
    var args = {
      data: $.param({
        "company": params.company,
        "loginId": params.loginId,
        "password": params.password,
        "name": params.name,
        "dept": params.dept,
        "mobile": params.mobile,
        "office": params.office,
      }),
      headers: self.restCommon.commonHeaders
    };

    self.restCommon.client.post(self.restCommon.apiurl + self.path, args,
      function(data, response) {
        callback(data, response);
      }).on('error', function(err) {
      console.error('something went wrong on the request', err.request.options);
    });
  };

module.exports = Empl;
