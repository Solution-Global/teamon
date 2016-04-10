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
  this.sipcall = null;
  this.myJsep = null;
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
  console.log("id: "+userid);

  if (this.janus !== null) {
    console.error('Already initialized');
    return;
  }

  // Initialize the library (console debug enabled)
  Janus.init({
    debug: false,
    callback: function() {
      // Create session
      self.janus = new Janus({
        server: server,
        success: function() {
          // Attach to echo test plugin
          self.janus.attach({
            plugin: "janus.plugin.sipgw",
            success: function(pluginHandle) {
              self.sipcall = pluginHandle;
              console.log("Plugin attached! (" + self.sipcall.getPlugin() + ", id=" + self.sipcall.getId() + ")");

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
              var error = msg.error;
              var errorCode = msg.error_code;
              if (error !== null && error !== undefined) {
                self._onErrorMessage(errorCode, error);
                return;
              }

              var result = msg.result;
              if (result !== null && result !== undefined) {
                if (result.event !== undefined && result.event !== null) {
                  var event = result.event;
                  if (event === 'registered') {
                    self.myusername = result.username;
                    self.registered = true;
                    self.emit('onregistered', self.myusername); // Register가 완료됐을 때
                  } else if (event === 'registration_failed') {
                    console.error("Registration failed: " + result.code + " " + result.reason);
                    self.registered = false;
                    self.emit('onregistration_failed');
                  } else if (event === 'calling') {
                    console.log("Waiting for the peer to answer...");
                    self.emit('oncalling');
                  } else if (event === 'incomingcall') {
                    self._onIncomingcall(result, jsep);
                  } else if (event === 'accepted') {
                    var peer = result.username;
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
                    self._onDeclining(result);
                  } else {
                    console.log("Unhandled event!");
                    console.log(JSON.stringify(result));
                  }
                }
              } else {
                console.log("Unhandled msg!");
                console.log(JSON.stringify(msg));
              }
            },
            onlocalstream: function(stream) {
              console.log(" ::: Got a local stream :::");
              // console.log(JSON.stringify(stream));

              self.emit('onlocalstream', stream);
            },
            onremotestream: function(stream) {
              console.log(" ::: Got a remote stream :::");
              // console.log(JSON.stringify(stream));

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
};

CallClient.prototype.finalize = function() {
  this.janus.destroy();
};

CallClient.prototype._registerUsername = function(userid) {
  var self = this;

  // TODO 현재는 자신의 emplid를 username으로 사용하기 때문에 중복로그인시 등록 실패 -> 중복 로그인 고려
  // Try a registration
  var register = {
    "request": "register",
    "secret": "",
    "proxy": constants.SIP_PROXY,
    "username": "sip:" + userid + "@" + constants.SIP_DOMAIN,
    "channel": "TEAMON"
  };
  self.sipcall.send({
    "message": register
  });
};

CallClient.prototype._onIncomingcall = function(result, jsep) {
  var self = this;

  var doAudio = true,
    doVideo = true;
  if (jsep !== null && jsep !== undefined) {
    // What has been negotiated?
    doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
    doVideo = (jsep.sdp.indexOf("m=video ") > -1);
  }

  console.log("_onIncomingcall Incoming call from " + result.username + " [Audio:" + doAudio + ", Video:" + doVideo + "]!");

  self.yourusername = result.username;
  self.remoteJsep = jsep;
  self.emit('onincomingcall', self.yourusername, doAudio, doVideo);
};

CallClient.prototype._onCallAccepted = function(peer, jsep) {
  var self = this;
  if (!self.engaged) {
    // 로컬의 경우 이미 전화가 끊어진 상태
    console.log("_onCallAccepted but not engaged!###");
    self._sendHangup();
    self._allInternalReset();
    return;
  }

  // TODO Video call can start
  var doAudio = false,
    doVideo = false;
  if (jsep !== null && jsep !== undefined) {
    doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
    doVideo = (jsep.sdp.indexOf("m=video ") > -1);

    self.sipcall.handleRemoteJsep({
      jsep: jsep,
      error: function() {
        console.error("_onCallAccepted : handleRemoteJsep error!");

        self._sendHangup();
        self._allInternalReset();
      }
    });
  }

  self.emit('oncallaccepted', peer, doAudio, doVideo);
};

CallClient.prototype._onErrorMessage = function(errorCode, error) {
  var self = this;
  console.error("errorCode:%d, error:%s", errorCode, error);

  // errorcode 447 : already calling
  // errorcode 478 : user doesn't exist
  // errorcode 480 : Already in a call
  // if (errorCode === 480) {
  //   // Janus GW에서 보내온 메시지에 따라 정상 처리되었지만 GW에서는 에러코드 상태 -> 테스트 진행을 위해 hangup 메시지 전송
  //   self._sendHangup();
  // }
  // self.sipcall.hangup();
  // self._resetStatus();

  self._allInternalReset();
  self.emit('onerrormessage', errorCode, error);
};

CallClient.prototype._onHangup = function(result) {
  var self = this;

  console.log("_onHangup [engaged:%s, yourusername:%s]", self.engaged, self.yourusername);
  if (self.engaged || self.yourusername) {
    // 상대가 종료한 경우
    // var username = result.username.;
    var username = self.yourusername;
    if (!username) {
      // 내가 전화한 경우에 대해 상대방이 수락하지 않는 경우
      username = self.yourusername;
    }
    self._allInternalReset();
    self.emit('onHangup', username, result.reason);
  } else {
    self._allInternalReset();
    if (self.myusername === result.username) {
      // 내가 종료한 경우 : 이미 cancelCall()에서 내부 종료처리 완료
      // self.emit('onHangup', result.username, result.reason);
    }
  }
};

CallClient.prototype._onDeclining = function(result) {
  var self = this;

  console.log("_onDeclining [code:%s, reason:%s, engaged:%s, yourusername:%s]", result.code, result.reason, self.engaged, self.yourusername);
  self._allInternalReset();
  self.emit('onDeclining', result.code, result.reason);
};

CallClient.prototype._onCleanup = function() {
  var self = this;
  var engaged = self.engaged;
  var yourusername = self.yourusername;
  console.log("_onCleanup [engaged:%s, yourusername:%s]", self.engaged, self.yourusername);
  // if (engaged || yourusername) {
  // self.emit('oncleanup', engaged, yourusername);
  // }

  // self._resetStatus();
};

CallClient.prototype.makeCall = function(userid) {
  var self = this;
  if (self.engaged) {
    self.emit('makecallerror', "Already engaged!");
    return;
  }
  self.engaged = true;
  self.yourusername = userid; // 최종 상대방 이름은 전화를 수락할 때 재설정 (수락하지않고 상대가 종료할 경우 대비)

  // Call this user
  self.sipcall.createOffer({
    media: {
      audioSend: true,
      audioRecv: true, // We DO want audio
      videoSend: true,
      videoRecv: true // We DO want audio
    },
    success: function(jsep) {
      // console.log("Got SDP!");
      // console.log(jsep);
      var body = {
        "request": "call",
        uri: "sip:" + userid + "@" + constants.SIP_DOMAIN,
        "channel": "TEAMON"
      };
      self.sipcall.send({
        "message": body,
        "jsep": jsep
      });
      self.myJsep = jsep;
    },
    error: function(error) {
      console.error("WebRTC error... " + error);
      self.engaged = false;
      self.emit('makecallerror', error);
    }
  });
};

// 전화 연결이후 로컬에서 끊는 경우
CallClient.prototype.localHangup = function() {
  var self = this;
  if (!self.engaged) {
    console.error("localHangup Not engaged!");
    return;
  }

  self._sendHangup(); // hangup 메시지 전송시에 반드시 hangup 이벤트가 와야 비정상 처리 제거 가능

  // 비정상적인 경우 hangup 이벤트가 오지않을 수 있어 종료 및 이벤트(중복 발생 가능) 처리
  self._allInternalReset();
  self.emit('onHangup', self.myusername, 'We did the hangup');
};

CallClient.prototype.answerCall = function(doAudio, doVideo) {
  var self = this;
  if (!self.remoteJsep) {
    self.emit('jserror', "No remoteJsep!");
    return;
  }
  self.engaged = true;

  self.sipcall.createAnswer({
    jsep: self.remoteJsep,
    media: {
      audio: doAudio,
      video: doVideo
    },
    success: function(jsep) {
      self.myJsep = jsep;
      // console.log("Got SDP! audio=" + doAudio + ", video=" + doVideo);
      // console.log(jsep);
      var body = {
        "request": "accept"
      };
      self.sipcall.send({
        "message": body,
        "jsep": jsep
      });

      // sip 버전의 경우 answerCall 성공시 accepted 이벤트가 전달되지 않아 내부 처리
      self.emit('oncallaccepted', null, doAudio, doVideo);
    },
    error: function(error) {
      console.error("WebRTC error:%s", JSON.stringify(error));
      // Don't keep the caller waiting any longer, but use a 480 instead of the default 486 to clarify the cause
      var body = {
        "request": "decline",
        "code": 480
      };
      sipcall.send({
        "message": body
      });

      self.emit('answercallerror', error);
    }
  });
};

// 전화 건 이후 상대방이 수락하기 전에 취소
CallClient.prototype.cancelCall = function() {
  var self = this;
  if (!self.engaged) {
    console.error("Not engaged!");
    return;
  }

  self._sendHangup(); // hangup 메시지 전송시에 반드시 hangup 이벤트가 와야 비정상 처리 제거 가능

  // 비정상적인 경우 hangup 이벤트가 오지않을 수 있어 종료 및 이벤트(중복 발생 가능) 처리
  self._allInternalReset();
  self.emit('onHangup', self.myusername, 'We did the hangup');
};

CallClient.prototype.declineCall = function() {
  var self = this;
  if (!self.remoteJsep) {
    self.emit('jserror', "No remoteJsep!");
    return;
  }

  var body = {
    "request": "decline"
  };
  self.sipcall.send({
    "message": body
  });
};

CallClient.prototype._sendHangup = function() {
  var self = this;

  // hangup can be used to terminate the communication at any time,
  // either to hangup an ongoing call or to cancel/decline a call that hasn't started yet.
  var hangup = {
    "request": "hangup"
  };
  self.sipcall.send({
    "message": hangup
  });
};

CallClient.prototype._allInternalReset = function() {
  var self = this;
  self._resetStatus();
  self.sipcall.hangup();
};

CallClient.prototype._resetStatus = function() {
  var self = this;
  self.engaged = false;
  self.myJsep = null;
  self.remoteJsep = null;
  self.yourusername = null;
};

module.exports = CallClient;
