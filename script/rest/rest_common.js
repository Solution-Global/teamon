var Client = require('node-rest-client').Client;
var RestCommon = (function(params){
  var client = new Client();
  var commonHeaders = {
    "X-Requested-With" : "XMLHttpRequest",
    "Accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
  };

  if(params.email) {
    commonHeaders['X-UANGEL-USER'] = params.email;
    commonHeaders['X-UANGEL-AUTHID'] = params.email;
  }

  if(params.channel) {
    commonHeaders['X-UANGEL-CHANNEL'] = params.channel;
  }
  if(params.authKey) {
    commonHeaders['X-UANGEL-AUTHKEY'] = params.authKey;
  }

  var apiurl = params.url;
  var path = params.path;

  var put = function(url, args, callback, callBackRequiredValues) {
    args.headers = commonHeaders;
    var restURL = apiurl + path + (url ? url : "");
    client.put(restURL, args,
      function(data, response) {
        if (response.statusCode == 200 || response.statusCode == 201) {
          if(callback) {
            callback(data, callBackRequiredValues);
          }
        } else {
          toastr.warning(data.userMessage);
  			}
      }).on('error',function(err){
        toastr.error("Something went wrong on the request");
    });
  };

  var get = function(url, args, callback, callBackRequiredValues) {
    args.headers = commonHeaders;
    var restURL = apiurl + path + (url ? url : "");
    client.get(restURL, args,
      function(data, response) {
        if (response.statusCode == 200 || response.statusCode == 201) {
          if(callback) {
            callback(data, callBackRequiredValues);
          }
        } else {
          toastr.warning(data.userMessage);
  			}
      }).on('error',function(err){
        toastr.error("Something went wrong on the request");
    });
  };

  var post = function(url, args, callback, callBackRequiredValues) {
    args.headers = commonHeaders;
    var restURL = apiurl + path + (url ? url : "");
    client.post(restURL, args,
      function(data, response) {
        if (response.statusCode == 200 || response.statusCode == 201) {
          if(callback) {
            callback(data, callBackRequiredValues);
          }
        } else {
          toastr.warning(data.userMessage);
  			}
      }).on('error',function(err){
        toastr.error("Something went wrong on the request");
    });
  };

  var del = function(url, args, callback, callBackRequiredValues) {
    args.headers = commonHeaders;
    var restURL = apiurl + path + (url ? url : "");
    client.delete(restURL, args,
      function(data, response) {
        if (response.statusCode == 200 || response.statusCode == 201) {
          if(callback) {
            callback(data, callBackRequiredValues);
          }
        } else {
          toastr.warning(data.userMessage);
  			}
      }).on('error',function(err){
        toastr.error("Something went wrong on the request");
    });
  };

  return {
    "put" : put,
    "get" : get,
    "post" : post,
    "delete" : del
  };
});

module.exports = RestCommon;
