// By convention, we name a constructor function by capitalizing the first letter.
// Constructor functions should always be called with the new operator.
var RestCommon = require("./rest_common");

var Empl = (function(params) {
  this.restCommon = new RestCommon(params);
  this.path ="/frontend/user/employee";
});

Empl.prototype.getListByTeamId = function(params, callback) {
  var self = this;
    console.log("getListByTeamId - [teamId]" + params.teamId + "[limit]" + params.limit + "[offset]" + params.offset + "[sIdx]" + params.sIdx + "[sOrder]" + params.sOrder);
    var args = {
      path : {
        "teamId" : params.teamId
      },
      parameters : {
        "limit" : params.limit ? params.limit : constants.COMMON_SEARCH_COUNT,
        "offset" : params.offset ? params.offset : constants.COMMON_SEARCH_OFFSET,
        "sIdx" : params.sIdx ? params.sIdx : "emplid",
        "sOrder" : params.sOrder ? params.sOrder : constants.COMMON_SEARCH_ORDER_ASC
      },
      headers: self.restCommon.commonHeaders
    };
    self.restCommon.client.get(self.restCommon.apiurl + self.path + "/team/${teamId}", args,
      function(data, response){
        callback(data);
    }).on('error',function(err){
      console.error('something went wrong on the request', err.request.options);
    });
  };

  Empl.prototype.createEmpl = function(params, callback) {
    var self = this;
    console.log("createEmpl - [team]" + params.team + "[email]" + params.email + "[name]" + params.name + "[mobile]" + params.mobile  + "[office]" + params.office);
    var args = {
      data: $.param({
        "team": params.team,
        "email": params.email,
        "password": params.password,
        "name": params.name,
        "mobile": params.mobile,
        "office": params.office,
      }),
      headers: self.restCommon.commonHeaders
    };

    self.restCommon.client.post(self.restCommon.apiurl + self.path + "/create", args,
      function(data, response) {
        callback(data, response);
      }).on('error', function(err) {
      console.error('something went wrong on the request', err.request.options);
    });
  };

module.exports = Empl;
