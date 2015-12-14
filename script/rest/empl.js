var Client = require('node-rest-client').Client;
var client = new Client();
var commonHeaders = {
  "X-UANGEL-USER" : "system",
  "X-UANGEL-CHANNEL" : "junit",
  "X-UANGEL-AUTHID" : "test",
  "X-UANGEL-AUTHKEY" : "e7575605-3d58-491f-8413-d11f5a2c7c3c",
  "Content-Type" : "application/x-www-form-urlencoded"
}; // request headers

var APIURL = "http://192.168.1.94:7587/rest";
var emplPATH ="/frontend/user/employee"

module.exports = {
  getListByCoid: function(params, callback) {
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
      headers: commonHeaders
    };
    client.get(APIURL + emplPATH + "/${coId}", args,
      function(data, response){
        callback(data);
    }).on('error',function(err){
			console.log('something went wrong on the request', err.request.options);
		});
    return "test";
  }
};
