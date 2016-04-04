// By convention, we name a constructor function by capitalizing the first letter.
// Constructor functions should always be called with the new operator.
var RestCommon = require("./rest_common");

var Empl = (function(params) {
  params.path ="frontend/user/employee";
  this.restCommon = new RestCommon(params);
});

Empl.prototype.addCommonHeader = function(configValues) {
  this.restCommon.setCommonHeader(configValues);
};

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
      }
    };
    self.restCommon.get("/team/${teamId}", args, callback);
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
      })
    };

    self.restCommon.post( "/create", args, callback);
  };


  Empl.prototype.changePassword = function(params, callback) {
    var self = this;
    console.debug("changePassword - [currentPassword] " + params.currentPassword + "[newPassword] " + params.newPassword + "[emplId] " + params.emplId);
    var args = {
      path : {
        "emplId" : params.emplId
      },
      data: $.param({
        emplId : params.emplId,
        currentPassword: params.currentPassword,
        newPassword: params.newPassword
      })
    };
    self.restCommon.put("/changePassword/${emplId}", args, callback);
  };

  Empl.prototype.changeProfileImg = function(params, callback) {
    var self = this;
    console.debug("changeProfileImg - [photoLoc] " + params.photoLoc + "[emplId] " + params.emplId);
    var args = {
      path : {
        "emplId" : params.emplId
      },
      data: $.param({
        emplId : params.emplId,
        photoLoc: params.photoLoc
      })
    };
    self.restCommon.put("/changeProfileImg/${emplId}", args, callback);
  };

module.exports = Empl;
