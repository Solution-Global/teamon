var Client = require('node-rest-client').Client;
var RestCommon = (function(){
  this.client = new Client();
  this.commonHeaders = {
    "X-UANGEL-USER" : "system",
    "X-UANGEL-CHANNEL" : "junit",
    "X-UANGEL-AUTHID" : "test",
    "X-UANGEL-AUTHKEY" : "e7575605-3d58-491f-8413-d11f5a2c7c3c",
    "Content-Type" : "application/x-www-form-urlencoded"
  };
  this.apiurl = "http://192.168.1.164:7587/rest";
});

module.exports = RestCommon
