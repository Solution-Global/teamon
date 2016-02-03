'use strict';

var CallClient = require('../call_client.js');

var callSection = (function() {
  var myPref;
  var connSection;
  var chatSection;
  var callClient;

  // cache DOM
  var $callSec;
  var $contentArea;
  var $infoArea;
  var $info;
  var $phone;
  var $callButton;
  var $videos;
  var $callDialog;

  function _initialize(pref, connSec, chatSec) {
    myPref = pref;
    connSection = connSec;
    chatSection = chatSec;

    $callSec = $(".call_section");
    $contentArea = $callSec.find('.content_area');
    $infoArea = $contentArea.find('.info_area');
    $info = $infoArea.find(".tit");
    $phone = $contentArea.find("#phone");
    $callButton = $phone.find("#call");
    $videos = $contentArea.find("#videos");
    $callDialog = $("#dialog");
  
    $infoArea.show();
    $phone.hide();
    $videos.hide();
    $contentArea.show();

    if (callClient === undefined)
      callClient = new CallClient();

    // bind events
    callClient.on('onregistered', _onRegistered); // janus 사용자 등록 성공
    callClient.on('onerrormessage', _onErrorMessage); // janus onmessage 중 에러메시지
    callClient.on('oncalling', _onCalling); // calling
    callClient.on('onincomingcall', _onIncomingCall); // incoming call
    callClient.on('oncallaccepted', _onCallAccepted); // 수락 (local or remote) 성공 메시지
    callClient.on('onlocalstream', _onLocalStream); // 자신의 Stream이 준비 되었을 때
    callClient.on('onremotestream', _onRemoteStream); // 상대방의의 Stream이 준비 되었을 때
    callClient.on('onHangup', _onHangup); // remote hangup
    callClient.on('oncleanup', _onCleanup); // cleanup
    callClient.on('makecallerror', _makeCallError); // makeCall network 에러
    callClient.on('answercallerror', _answerCallError); // answerCall network 에러
    callClient.on('jserror', _jsError); // call.js 자체 상태 에러

    // 재연결이 필요한 에러
    callClient.on('sessionerror', _gwError);
    callClient.on('onregistration_failed', _gwError);
    callClient.on('pluginerror', _gwError);

    callClient.initialize(myPref.emplId);
  }

  function _onRegistered(username) {
    $info.html("Successfully registered!");
  }

  function _onErrorMessage(errorCode, error) {
    $info.html('Error: ' + error + ' [errorCode: ' + errorCode + ']!');
  }

  function _makeCallError(msg) {
    $info.html(msg);
  }

  function _onCalling() {
    // TODO Any ringtone?
    var msg = "Calling... Need any ringbacktone?";
    $info.html(msg);
    $callDialog.text(msg).dialog({
      title: "Calling...",
      modal: true,
      draggable: false,
      resizable: false,
      position: ['center', 'top'],
      show: 'blind',
      hide: 'blind',
      width: 300,
      buttons: {
        "Cancel": function() {
          callClient.cancelCall();
          $callDialog.dialog("close");
        }
      },
      closeOnEscape: false,
      open: function(event, ui) {
        $(".ui-dialog-titlebar-close").hide();
      }
    }).dialog("open");
  }

  function _onIncomingCall(caller) {
    console.log("Incoming call from " + caller + "!");

    var callerObj = connSection.getUserObj(caller);
    var callerName = (callerObj !== null) ? callerObj.loginId : caller;
    var msg = "Incoming call from " + callerName + "!";

    $callDialog.text(msg).dialog({
      title: "Incoming call",
      modal: true,
      hideCloseButton: true,
      draggable: false,
      resizable: false,
      position: ['center', 'top'],
      show: 'blind',
      hide: 'blind',
      width: 300,
      buttons: {
        "Answer": function() {
          callClient.answerCall();
          $callDialog.dialog("close");
        },
        "Decline": function() {
          callClient.declineCall();
          $callDialog.dialog("close");
        }
      },
      closeOnEscape: false,
      open: function(event, ui) {
        $(".ui-dialog-titlebar-close").hide();
      }
    }).dialog("open");
  }

  function _answerCallError() {
    $info.html(msg);
  }

  function _onCallAccepted(peer) {
    if ($callDialog.dialog("isOpen")) {
      $callDialog.dialog("close");
    }

    $videos.show();
    var msg;
    if (peer === null || peer === undefined) {
      msg = "Call started!";
    } else {
      var peerObj = connSection.getUserObj(peer);
      var peerName = (peerObj !== null) ? peerObj.loginId : peer;
      msg = peerName + " accepted the call!";
    }

    $info.html(msg);
    _toggleButtonInfo(true, 'Hangup', _localHangup);
  }

  function _onLocalStream(stream) {
    if ($('#myvideo').length === 0) {
      $('#videoleft').append('<video class="rounded centered" id="myvideo" width=90% height=200 autoplay muted="muted"/>');
    }
    attachMediaStream($('#myvideo').get(0), stream);
    $("#myvideo").get(0).muted = "muted";

    var videoTracks = stream.getVideoTracks();
    if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
      // No webcam
      $('#myvideo').remove();
      $('#videoleft').append('<span class="no-video-text">No webcam available</span>');
    }
  }

  function _onRemoteStream(stream) {
    if ($('#remotevideo').length === 0) {
      $('#videoright').append('<video class="rounded centered" id="remotevideo" width=90% height=200 autoplay/>');
    }
    attachMediaStream($('#remotevideo').get(0), stream);
    var videoTracks = stream.getVideoTracks();
    if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0 || videoTracks[0].muted) {
      // No remote video
      $('#remotevideo').remove();
      $('#videoright').append('<span class="no-video-text">No remote video available</span>');
    }
  }

  function _onCleanup(engaged, yourusername) {
    if ($callDialog.dialog("isOpen")) {
      $callDialog.dialog("close");
    }

    var msg = engaged ? 'No answer!' : 'Canceled';
    $info.html(msg);
  }

  function _cleanVideoArea() {
    $('#myvideo').remove();
    $('#remotevideo').remove();

    $videos.hide();
  }

  function _onHangup(username, reason) {
    if ($callDialog.dialog("isOpen")) {
      $callDialog.dialog("close");
    }
    _cleanVideoArea();

    var msg = "Call hung up by " + username + " (" + reason + ")!";
    $info.html(msg);

    $callButton.html('Call')
      .unbind('click').click(_makeCall);
  }

  function _jsError(msg) {
    $info.html(msg);
  }

  function _gwError(msg) {
    if ($callDialog.dialog("isOpen")) {
      $callDialog.dialog("close");
    }
    $('#myvideo').hide();

    $info.html(msg);
  }

  function _toggleButtonInfo(show, title, eventHandler) {
    if (show) {
      $phone.show();
      $callButton.html(title)
        .unbind('click').click(eventHandler);
    } else {
      $phone.hide();
    }
  }

  function initCallSection(pref, connSec, chatSec) {
    _initialize(pref, connSec, chatSec);
  }

  function showCallInfo(chatId, username) {
    if (callClient.registered && !callClient.engaged) {
      $info.html('Make a call to ' + username + '?');
      _toggleButtonInfo(true, 'Call', _makeCall);
      _cleanVideoArea()
    }
  }

  function _makeCall() {
    var peer = connSection.getCurrentTargetUser();
    if (peer === undefined) {
      console.error("No peer selected!");
    }

    callClient.makeCall(peer);
  }

  function _localHangup() {
    callClient.localHangup();
    $videos.hide();
  }

  return {
    initCallSection: initCallSection,
    showCallInfo: showCallInfo
  };
})();

module.exports = callSection;
