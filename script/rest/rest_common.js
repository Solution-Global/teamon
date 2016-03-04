var Client = require('node-rest-client').Client;
var RestCommon = (function(params){
  this.client = new Client();
  this.commonHeaders = {
    "X-UANGEL-USER" : params.loginId,
    "X-UANGEL-CHANNEL" : params.channel,
    "X-UANGEL-AUTHID" : params.loginId,
    "X-UANGEL-AUTHKEY" : params.authkey,
    "Content-Type" : "application/x-www-form-urlencoded",
    "X-Requested-With" : 'XMLHttpRequest'
  };
  this.apiurl = params.url;
});

module.exports = RestCommon;
