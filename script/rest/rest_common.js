var Client = require('node-rest-client').Client;
var RestCommon = (function(params){
  this.client = new Client();
  this.commonHeaders = {
    "X-Requested-With" : "XMLHttpRequest",
    "Accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
  };

  if(params.email) {
    this.commonHeaders['X-UANGEL-USER'] = params.email;
    this.commonHeaders['X-UANGEL-AUTHID'] = params.email;
  }

  if(params.channel) {
    this.commonHeaders['X-UANGEL-CHANNEL'] = params.channel;
  }
  if(params.authKey) {
    this.commonHeaders['X-UANGEL-AUTHKEY'] = params.authKey;
  }

  this.apiurl = params.url;
});

module.exports = RestCommon;
