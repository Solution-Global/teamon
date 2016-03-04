var Client = require('node-rest-client').Client;
var RestCommon = (function(user, channel, authid, authkey){
  this.client = new Client();
  this.commonHeaders = {
    "X-UANGEL-USER" : constants.API_HEADER_X_UANGEL_USER,
    "X-UANGEL-CHANNEL" : constants.API_HEADER_X_UANGEL_CHANNEL,
    "X-UANGEL-AUTHID" : constants.API_HEADER_X_UANGEL_AUTHID,
    "X-UANGEL-AUTHKEY" : constants.API_HEADER_X_UANGEL_AUTHKEY,
    "Content-Type" : constants.API_HEADER_Content_Type,
    "X-Requested-With" : 'XMLHttpRequest'
  };
  this.apiurl = constants.API_URL;
});

module.exports = RestCommon;
