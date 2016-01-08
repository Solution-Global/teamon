var restCommon = require("./rest_common");

var Chat = (function() {
  this.restCommon = new restCommon();
  this.path ="/frontend/communication/chat";
});

Chat.prototype.getListByPeers = function(params, callback) {
  var self = this;
    console.log("getListByCoid - [peer1]" + params.peer2 + "[peer1]" + params.peer2);
    var args = {
      parameters : {
        "peer1" : params.peer1,
        "peer2" : params.peer2
      },
      headers: self.restCommon.commonHeaders
    };
    self.restCommon.client.get(self.restCommon.apiurl + self.path , args,
      function(data, response){
        console.log(data);
        callback(data);
    }).on('error',function(err){
      console.log('something went wrong on the request', err.request.options);
    });
  }

module.exports =  Chat
