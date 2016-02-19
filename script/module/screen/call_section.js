'use strict';

var constants = require("../constants");
var CallClient = require('../call_client.js');

var callSection = (function() {
  var callClient;
  var callHistoryId, callHistoryTimeout, callStartTime;
  var callerId, calleeId;

  // cache DOM
  var $callSec;
  var $contentArea;
  var $infoArea;
  var $info;
  var $videos;
  var $hangupButton;
  var $callMemo;

  function _initialize() {
    $callSec = $("#call-section");
    $contentArea = $callSec.find(".content_area");
    $infoArea = $contentArea.find(".info_area");
    $info = $infoArea.find(".tit");
    $videos = $contentArea.find("#videos");
    $hangupButton = $videos.find("#hangup");
    $callMemo = $videos.find("#callMemo");

    $callSec.hide();

    callHistoryId = null;
    callHistoryTimeout = null;
    if (callClient === undefined)
      callClient = new CallClient();

    // bind events (general)
    $hangupButton.on('click', _localHangup);

    // bind events (callClient)
    callClient.on('onregistered', _onRegistered); // janus 사용자 등록 성공
    callClient.on('onerrormessage', _onErrorMessage); // janus onmessage 중 에러메시지
    callClient.on('oncalling', _onCalling); // calling
    callClient.on('onincomingcall', _onIncomingCall); // incoming call
    callClient.on('oncallaccepted', _onCallAccepted); // 수락 (local or remote) 성공 메시지
    callClient.on('onlocalstream', _onLocalStream); // 자신의 Stream이 준비 되었을 때
    callClient.on('onremotestream', _onRemoteStream); // 상대방의의 Stream이 준비 되었을 때
    callClient.on('onHangup', _onHangup); // local or remote hangup
    callClient.on('onDeclining', _onDeclining); // 자신이 수락 거절하는 경우
    callClient.on('oncleanup', _onCleanup); // cleanup
    callClient.on('makecallerror', _makeCallError); // makeCall network 에러
    callClient.on('answercallerror', _answerCallError); // answerCall network 에러
    callClient.on('jserror', _jsError); // call.js 자체 상태 에러

    // 재연결이 필요한 에러 (callClient)
    callClient.on('sessionerror', _gwError);
    callClient.on('onregistration_failed', _gwError);
    callClient.on('pluginerror', _gwError);

    callClient.initialize(myPref.emplId);

    hideSection(); // hide basically
  }

  function reloadSection() {
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
    callerId = myPref.emplId;
    calleeId = activeChatInfo.chatRoomId;
    $info.html(msg);

    swal({
      title: "Calling...",
      text: msg,
      type: "info",
      allowEscapeKey: false,
      showCancelButton: false,
      confirmButtonColor: "#1a7bb9",
      confirmButtonText: "Cancel",
      closeOnConfirm: false
    }, function() {
      callClient.cancelCall();
      swal.close();
    });
  }

  function _onIncomingCall(caller, doAudio, doVideo) {
    console.log("Incoming call from " + caller + "!");

    var callerObj = catalogSection.getUserObj(caller);
    var callerName = (callerObj !== null) ? callerObj.loginId : caller;
    callerId = caller;
    calleeId = myPref.emplId;
    var msg = "Incoming call from " + callerName + "!";

    swal({
      title: "Incoming call",
      text: msg,
      type: "info",
      allowEscapeKey: false,
      showCancelButton: true,
      cancelButtonText: "Decline",
      confirmButtonColor: "#1a7bb9",
      confirmButtonText: "Answer",
      closeOnCancel: false,
      closeOnConfirm: false
    }, function(isConfirm) {
      if (isConfirm) {
        callClient.answerCall(doAudio, doVideo);
        swal.close();

        chatSection.hideSection(); // chat Area
        callSection.showSection();
        screenshareSection.hideSection();
      } else {
        callClient.declineCall();
        swal.close();
      }
    });
  }

  function _answerCallError() {
    $info.html(msg);
  }

  function _onCallAccepted(peer, doAudio, doVideo) {
    swal.close();
    $videos.show();

    var msg;
    if (peer === null || peer === undefined) {
      msg = "Call started!";
    } else {
      var peerObj = catalogSection.getUserObj(peer);
      var peerName = (peerObj !== null) ? peerObj.loginId : peer;
      msg = peerName + " accepted the call!";

      // call history 생성 트리거 : 발신자가 call history 생성하여 공유 (3초 이내 종료 호에 대해서는 무시)
      if (callHistoryTimeout !== null) {
        clearTimeout(callHistoryTimeout);
      }
      callHistoryTimeout = setTimeout(_createCallHistory, 3000);
      callStartTime = new Date();
    }

    $info.html(msg);
  }

  function _createCallHistory() {
    if ($videos.is(":visible")) {
      var args = {
        "coId": myPref.coId,
        "caller": callerId,
        "callee": calleeId,
        "callStart": callStartTime.format("YYYYMMDDHHmmss")
      }

      restResourse.callHistory.createCallHistory(args, function(data) {
        callHistoryId = data.callHistoryId;
        _shareCallHistoryIdToPeer(calleeId, callHistoryId);
        console.log("current call history id:%d [data:%O]", callHistoryId, data);
      });
    }
  }

  // call history는 발신자가 레코드를 생성하여 수신자에게 공유 (DB 레코드에서 히스토리 정보 공유 및 자신의 메모 정보 업데이트 가능)
  function _shareCallHistoryIdToPeer(calleeId, callHistoryId) {
    var paramsForExistMember = {
      "type": constants.CALL_SHARE_CHID,
      "callHistoryId": callHistoryId
    }
    chatModule.sendCommand(calleeId, paramsForExistMember);
  }

  function _updateCallHistory() {
    if ($videos.is(":visible")) {
      var args = {
        "callhid": callHistoryId
      }

      var updateCallHistory = false;
      if (callerId === myPref.emplId) {
        args.memo = $callMemo.val();
        args.callTime = Math.ceil((new Date().getTime() - callStartTime.getTime()) / 1000);
        updateCallHistory = true;
      } else if (calleeId === myPref.emplId) {
        // TODO 현재는 필드 분리가 안되어 있어 caller만 메모 남김
        // args.memo = $callMemo.val();
        args.memo = "";
        if (args.memo.length) {
          updateCallHistory = true;
        }
      }

      if (updateCallHistory) {
        restResourse.callHistory.updateCallHistory(args, function(data) {
          console.log("successfully updated call history! [memo:%s, callTime:%d]", args.memo, args.callTime);
        });
      }
    }
  }

  function _onLocalStream(stream) {
    if ($('#myvideo').length === 0) {
      $('#videolocal').append('<video class="rounded centered" id="myvideo" width=200 height=100% autoplay muted="muted"/>');
    }
    attachMediaStream($('#myvideo').get(0), stream);
    $("#myvideo").get(0).muted = "muted";

    var videoTracks = stream.getVideoTracks();
    if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
      // No webcam
      $('#myvideo').remove();
      $('#videolocal').append('<span class="no-video-text">No webcam available</span>');
    }
  }

  function _onRemoteStream(stream) {
    if ($('#remotevideo').length === 0) {
      $('#videoremote').append('<video class="rounded centered" id="remotevideo" width=250 height=100% autoplay/>');
    }
    attachMediaStream($('#remotevideo').get(0), stream);
    var videoTracks = stream.getVideoTracks();
    if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0 || videoTracks[0].muted) {
      // No remote video
      $('#remotevideo').remove();
      $('#videoremote').append('<span class="no-video-text">No remote video available</span>');
    }
  }

  function _onCleanup(engaged, yourusername) {
    swal.close();

    var msg = engaged ? 'No answer!' : 'Canceled';
    $info.html(msg);
  }

  function _cleanVideoArea() {
    $('#myvideo').remove();
    $('#remotevideo').remove();

    // call history 처리
    if (callHistoryTimeout !== null) {
      clearTimeout(_createCallHistory);
      callHistoryTimeout = null;
    }

    if (callHistoryId !== null) {
      _updateCallHistory(callMemo);
      callHistoryId = null;
    }
    $callMemo.val("");

    $videos.hide();
  }

  function _onHangup(username, reason) {
    swal.close();
    _cleanVideoArea();

    var userObj = catalogSection.getUserObj(username);
    var userName = (userObj !== null) ? userObj.loginId : username;
    var msg = "Call hung up by " + userName + " (" + reason + ")!";
    $info.html(msg);
  }

  function _onDeclining(code, reason) {
    var msg = "Declined!";
    $info.html(msg);
  }

  function _jsError(msg) {
    $info.html(msg);
  }

  function _gwError(msg) {
    swal.close();
    $('#myvideo').hide();

    $info.html(msg);
  }

  function initCallSection() {
    _initialize();
  }

  function loadCallSection() {
    loadHtml("./html/call/call_section.html", $("#call-section"));
  }

  function showCallInfo(chatId, username) {
    if (callClient.registered && !callClient.engaged) {
      $info.html('Make a call to ' + username + '?');
      _cleanVideoArea();
      _makeCall();
    }
  }

  function _makeCall() {
    var peer = activeChatInfo.chatRoomId;
    if (peer === undefined) {
      console.error("No peer selected!");
    }

    callClient.makeCall(peer);
  }

  function _localHangup() {
    callClient.localHangup();
    $videos.hide();
  }

  function hideSection() {
    $callSec.hide();
  }

  function showSection() {
    $callSec.show();
  }

  function setCallHistoryId(callHId) {
    // 통화 중인 경우에만 call history id 설정
    if (callerId !== null && calleeId != null) {
      callHistoryId = callHId;
    }
  }

  return {
    initCallSection: initCallSection,
    reloadSection: reloadSection,
    loadCallSection: loadCallSection,
    showCallInfo: showCallInfo,
    hideSection: hideSection,
    showSection: showSection,
    setCallHistoryId: setCallHistoryId
  };
})();

module.exports = callSection;
