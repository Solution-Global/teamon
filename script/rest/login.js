// https://www.npmjs.com/package/node-rest-client 참고

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
var loginPATH ="/frontend/user/login"

module.exports = {
  login: function(params, callback) {
    console.log("login - [company]" + params.company + "[loginid]" + params.loginId + "[password]" + params.password);
    // TODO : 추후 http request 값 가져오도록 수정
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
    	headers: commonHeaders
    };

    client.put(APIURL + loginPATH + "/${company}/${loginId}", args,
      function(data, response){
        callback(data);
    }).on('error',function(err){
			console.log('something went wrong on the request', err.request.options);
		});
    return "test";

  },
  logout: function(emplId) {
    console.log("logout - [emplId]" + emplId);
    var args = {
      path : {
        "emplId" : emplId
      },
      headers: commonHeaders
    };
    client.put(APIURL + loginPATH + "/${emplId}", args,
      function(data, response){
        // parsed response body as js object
    		console.log(data);
    		// raw response
    		console.log(response);
    });
    return "test";
  }
};
