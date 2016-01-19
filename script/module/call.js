'use strict';

var constants = require("./constants"),
  events = require('events'),
  util = require('util');

function CallClient() {
  if (!(this instanceof CallClient)) {
    return new CallClient();
  }

  this.registered = false;
  this.janus = null;
  this.engaged = false;
  this.videocall = null;
  this.remoteJsep = null;
  this.myusername = null;
  this.yourusername = null;

  events.EventEmitter.call(this);
}
util.inherits(CallClient, events.EventEmitter);

CallClient.prototype.initialize = function(userid) {
  var self = this;
  var server = constants.CALL_GW_URL;
  console.log("gateway url: %s", server);

  if (this.janus !== null) {
    console.error('Already initialized');
    return;
  }

  // Initialize the library (console debug enabled)
  Janus.init({
    debug: true,
    callback: function() {
      // Create session
      self.janus = new Janus({
        server: server,
        success: function() {
          // Attach to echo test plugin
          self.janus.attach({
            plugin: "janus.plugin.videocall",
            success: function(pluginHandle) {
              self.videocall = pluginHandle;
              console.log("Plugin attached! (" + self.videocall.getPlugin() + ", id=" + self.videocall.getId() + ")");

              self._registerUsername(userid);
            },
            error: function(error) {
              console.error("  -- Error attaching plugin... " + error);
              self.emit('pluginerror', error);
            },
            consentDialog: function(on) {
              console.log("Consent dialog should be " + (on ? "on" : "off") + " now");
              // self.emit('consentdialog');

              // on : 사용자로부터 WebRTC 자원 사용 동의를 얻기 전
              // off : 사용자로부터 WebRTC 자원 사용 동의를 얻은 후
            },
            onmessage: function(msg, jsep) {
              console.log(" ::: Got a message :::");
              console.log(JSON.stringify(msg));
              // Any error?
              var error = msg["error"];
              var errorCode = msg["error_code"];
              if (error !== null && error !== undefined) {
                self._onErrorMessage(errorCode, error);
                return;
              }

              var result = msg["result"];
              if (result !== null && result !== undefined) {
                if (result["event"] !== undefined && result["event"] !== null) {
                  var event = result["event"];
                  if (event === 'registered') {
                    self.myusername = result["username"];
                    self.registered = true;
                    self.emit('onregistered', self.myusername); // Register가 완료됐을 때
                  } else if (event === 'registration_failed') {
                    console.error("Registration failed: " + result["code"] + " " + result["reason"]);
                    self.registered = false;
                    self.emit('onregistration_failed');
                  } else if (event === 'calling') {
                    console.log("Waiting for the peer to answer...");
                    self.emit('oncalling');
                  } else if (event === 'incomingcall') {
                    self.yourusername = result["username"];
                    self.remoteJsep = jsep;
                    self.emit('onincomingcall', self.yourusername);
                  } else if (event === 'accepted') {
                    var peer = result["username"];
                    if (peer === null || peer === undefined) {
                      console.log("Call started!");
                    } else {
                      console.log(peer + " accepted the call!");
                      self.yourusername = peer;
                    }
                    self._onCallAccepted(peer, jsep);
                  } else if (event === 'hangup') {
                    self._onHangup(result);
                  } else if (event === 'declining') {
                    console.log("Call declined (" + result["code"] + " " + result["reason"] + ")!");
                  }
                }
              } else {
                // FIXME Error?
                var error = msg["error"];
                console.error(error);
              }
            },
            onlocalstream: function(stream) {
              console.log(" ::: Got a local stream :::");
              console.log(JSON.stringify(stream));

              self.emit('onlocalstream', stream);
            },
            onremotestream: function(stream) {
              console.log(" ::: Got a remote stream :::");
              console.log(JSON.stringify(stream));

              self.emit('onremotestream', stream);
            },
            oncleanup: function() {
              console.log(" ::: Got a cleanup notification :::");
              self._onCleanup();
            }
          });
        },
        error: function(error) {
          console.error("  -- Error... " + error);
          self.emit('sessionerror', error);
        },
        destroyed: function() {
          console.log("destroyed...");
        }
      });
    }
  });
}

CallClient.prototype._registerUsername = function(userid) {
  var self = this;

  // TODO 현재는 자신의 emplid를 username으로 사용하기 때문에 중복로그인시 등록 실패 -> 중복 로그인 고려
  // Try a registration
  var register = {
    "request": "register",
    "username": userid.toString()
  };
  self.videocall.send({
    "message": register
  });
}

CallClient.prototype._onCallAccepted = function(peer, jsep) {
  var self = this;
  if (!self.engaged) {
    // 로컬의 경우 이미 전화가 끊어진 상태
    console.log("_onCallAccepted but not engaged!###");
    self._sendHangup();
    self._resetStatus();
    return;
  }

  // TODO Video call can start
  if (jsep !== null && jsep !== undefined)
    self.videocall.handleRemoteJsep({
      jsep: jsep
    });

  self.emit('oncallaccepted', peer);
}

CallClient.prototype._onErrorMessage = function(errorCode, error) {
  var self = this;
  console.error("errorCode:%d, error:%s", errorCode, error);

  // errorcode 447 : already calling
  // errorcode 478 : user doesn't exist
  // errorcode 480 : Already in a call
  if (errorCode === 480) {
    // Janus GW에서 보내온 메시지에 따라 정상 처리되었지만 GW에서는 에러코드 상태 -> 테스트 진행을 위해 hangup 메시지 전송
    self._sendHangup();
  }
  self.videocall.hangup();
  self._resetStatus();
  self.emit('onerrormessage', errorCode, error);
}

CallClient.prototype._onHangup = function(result) {
  var self = this;

  console.log("_onHangup### " + self.engaged + ", " + self.yourusername);
  if (self.engaged || self.yourusername) {
    self.emit('onHangup', result["username"], result["reason"]);
  } else {
    console.log("Not engaged and no yourusername! Call hung up by " + result["username"] + " (" + result["reason"] + ")!");
  }

  self._resetStatus();
  self.videocall.hangup();
}

CallClient.prototype._onCleanup = function() {
  var self = this;
  var engaged = self.engaged;
  var yourusername = self.yourusername;
  console.log("_onCleanup### " + engaged + ", " + yourusername);
  if (engaged || yourusername) {
    self.emit('oncleanup', engaged, yourusername);
  }
  self._resetStatus();
}

CallClient.prototype.makeCall = function(userid) {
  var self = this;
  if (self.engaged) {
    self.emit('makecallerror', "Already engaged!");
    return;
  }
  self.engaged = true;

  // Call this user
  self.videocall.createOffer({
    // By default, it's sendrecv for audio and video...
    media: {
      data: false
    },
    success: function(jsep) {
      console.log("Got SDP!");
      console.log(jsep);
      var body = {
        "request": "call",
        "username": userid.toString()
      };
      self.videocall.send({
        "message": body,
        "jsep": jsep
      });
    },
    error: function(error) {
      console.error("WebRTC error... " + error);
      self.engaged = false;
      self.emit('makecallerror', error);
    }
  });
}

CallClient.prototype.localHangup = function() {
  var self = this;
  if (self._sendHangup()) {
    self._clearResource(false, null, null);
  }
}

CallClient.prototype.answerCall = function() {
  var self = this;
  if (!self.remoteJsep) {
    self.emit('jserror', "No remoteJsep!");
    return;
  }
  self.engaged = true;

  self.videocall.createAnswer({
    jsep: self.remoteJsep,
    // No media provided: by default, it's sendrecv for audio and video
    media: {
      data: true
    }, // Let's negotiate data channels as well
    success: function(jsep) {
      console.log("Got SDP!");
      console.log(jsep);
      var body = {
        "request": "accept"
      };
      self.videocall.send({
        "message": body,
        "jsep": jsep
      });
    },
    error: function(error) {
      console.error("WebRTC error:%s", JSON.stringify(error));
      self.emit('answercallerror', error);
    }
  });
}

CallClient.prototype.cancelCall = function() {
  var self = this;
  if (!self.engaged) {
    console.error("Not engaged!");
    return;
  }

  self._sendHangup();
}

CallClient.prototype.declineCall = function() {
  var self = this;
  if (!self.remoteJsep) {
    self.emit('jserror', "No remoteJsep!");
    return;
  }

  self._sendHangup();
}

CallClient.prototype._sendHangup = function() {
  var self = this;

  // hangup can be used to terminate the communication at any time,
  // either to hangup an ongoing call or to cancel/decline a call that hasn't started yet.
  var hangup = {
    "request": "hangup"
  };
  self.videocall.send({
    "message": hangup
  });
}

CallClient.prototype._resetStatus = function() {
  var self = this;
  self.engaged = false;
  self.remoteJsep = null;
  self.yourusername = null;
}

module.exports = CallClient;
