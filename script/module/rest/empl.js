var restCommon = require("./rest_common");

var Empl = (function() {
  this.restCommon = new restCommon();
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
        "limit" : params.limit ? params.limit : 10,
        "offset" : params.offset ? params.offset : 0,
        "sIdx" : params.sIdx ? params.sIdx : "loginid",
        "sOrder" : params.sOrder ? params.sOrder : "asc"
      },
      headers: self.restCommon.commonHeaders
    };
    self.restCommon.client.get(self.restCommon.apiurl + self.path + "/${coId}", args,
      function(data, response){
        callback(data);
    }).on('error',function(err){
      console.log('something went wrong on the request', err.request.options);
    });
  }

module.exports =  Empl
