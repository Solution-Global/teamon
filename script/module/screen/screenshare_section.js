'use strict';

var remote = require('remote');
var screen = require ('screen');
var desktopCapturer = require('electron').desktopCapturer;

var desktopSharing = false;
var localStream = null;
var dispSize = screen.getPrimaryDisplay().size;
var calleeEmplId = null;
var desktopStream = null;
var peer;
var mediaConnection;
var $screenshareSec;
var isSwitchSectionOn = false;

var screenshareSection = (function() {

  function _initialize() {
    $screenshareSec = $("#screenshare-section");
    var myEmployeeId = myPref.emplId;

    // PeerJS object
    //var peer = new Peer({ key: 'lwjd5qra8257b9', debug: 3});
    peer = new Peer(myEmployeeId, {key: 'lwjd5qra8257b9'});

    peer.on('open', function(){
      console.log('peer id : ' + peer.id);
    });

    // When callee receives a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      console.log('got a call!! from ' + activeChatInfo.chatRoomId);

      call.answer(window.localStream);
      displayScreen(call);
    });

    peer.on('error', function(err) {
      console.error(err.message);
      closeScreenshare();

      // Close media connection to generate 'close' event
      if (mediaConnection) {
        mediaConnection.close();
      }

      // Close media connection to generate 'close' event
      if (window.existingCall) {
        window.existingCall.close();
      }
    });
  }

  function closeScreenshare() {
    hideSection();
    adjustSectionSize(chatSection.getSection(), 9);
    adjustSectionSize(informationSection.getSection(), 3);
    chatSection.showSection();
    informationSection.showSection();

    desktopSharing = false;
    if(isSwitchSectionOn) {
      isSwitchSectionOn = false;
      chatSection.getSection().insertAfter($screenshareSec); // 위치 변경
    }
  }

  function displayScreen(call) {
    // Hang up on an existing call if present
    if (window.existingCall) {
      window.existingCall.close();
    }

    // Wait for stream on the call, then set peer video display
    call.on('stream', function(stream){
      initilizeButtons();
      callSection.hideSection();
      informationSection.hideSection();
      adjustSectionSize(screenshareSection.getSection(), 8);
      adjustSectionSize(chatSection.getSection(), 4);
      showSection();

      $('#peer-video').prop('src', URL.createObjectURL(stream));
      $('#peer-video').show();
      $('#my-video').hide();
    });

    // Close event from callee to caller
    call.on('close', function() {
      closeScreenshare();
    });

    // UI stuff
    window.existingCall = call;
  }

  function initScreenshareSection() {
    _initialize();
  }

  function refresh() {
    $('select').imagepicker({
      hide_select : false,
      show_label  : true
    });
  }

  function addSource(source) {
    $('select').append($('<option>', {
      value: source.id.replace(":", ""),
      text: source.name
    }));

    $('select option[value="' + source.id.replace(":", "") + '"]').attr('data-img-src', source.thumbnail.toDataUrl());
    refresh();
  }

  function showSources() {
    desktopCapturer.getSources({ types:['window'] }, function(error, sources) {
      for (var i = 0; i < sources.length; ++i) {
        // Disable selecting Team ON application to avoid reflected window
        if (!sources[i].name.startsWith("Team ON")) {
            addSource(sources[i]);
          }
      }
    });
  }

  function toggle() {
    if (!desktopSharing) {
      var id = ($('.picture').val()).replace(/window|screen/g, function(match) { return match + ":"; });
      onAccessApproved(id);
    } else {
      desktopSharing = false;

      if (window.localStream) {
        window.localStream.getTracks().forEach(function (track) { track.stop(); });
      }

      showSources();
      refresh();
    }
  }

  function onAccessApproved(desktop_id) {
    var screenshareWidth = $screenshareSec.find('.content_area').outerWidth(true);
    var screenshareHeight = $screenshareSec.find('.content_area').outerHeight(true);

    if (screenshareWidth <= 1024) {
      screenshareWidth = 1024;
    }

    if (screenshareHeight <= 768) {
      screenshareHeight = 768;
    }

    if (!desktop_id) {
      console.log('Desktop Capture access rejected.');
      return;
    }

    desktopSharing = true;
    console.log("Desktop sharing started.. desktop_id:" + desktop_id);
    navigator.webkitGetUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: desktop_id,
          maxWidth: screenshareWidth,
          minWidth: 1024,
          maxHeight: screenshareHeight,
          minHeight: 768
        }
      }
    }, gotStream, getUserMediaError);
  }

  function gotStream(stream) {
    window.localStream = stream;

    // If peer is disconnected, reconnect peer.
    if (peer.disconnected) {
      peer.reconnect();
    }

    mediaConnection = peer.call(calleeEmplId, window.localStream);

    $('#my-video').prop('src', URL.createObjectURL(stream));
    $('#my-video').show();
    $('.fullScreen').hide();
    $('#peer-video').hide();

    stream.onended = function() {
      if (desktopSharing) {
        toggle();
      }
    };

    // Close event from caller to callee
    mediaConnection.on('close', function() {
      closeScreenshare();
    });
  }

  function getUserMediaError(e) {
      console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
  }

  function initilizeButtons()
  {
    $('.fullScreen').click(function() {
      fullScreen();
    });

    $('.cancelScreenShare').click(function() {
      closeScreenshare();

      // Close media connection to generate 'close' event
      if (mediaConnection) {
        mediaConnection.close();
      }

      // Close media connection to generate 'close' event
      if (window.existingCall) {
        window.existingCall.close();
      }
    });
  }

  function showDialog(calleeId) {
    openModalDialog("./html/screenshare/popup/screenshare_popup.html");
    var calleeObj = catalogSection.getUserObj(calleeId);
    var calleeName = (calleeObj !== null) ? calleeObj.loginId : calleeId;
    console.log('Screen share to ' + calleeName + ' , calleeId : ' + calleeId);

    initilizeButtons();
    $('select').empty();
    showSources();
    $('#screenModal').show();

    $('.enableScreenCapture').click(function() {
      toggle();
      $('#screenModal').hide();
      informationSection.hideSection();
      adjustSectionSize(screenshareSection.getSection(), 4); // local의  screanSection은 크기는 작도록 설정
      adjustSectionSize(chatSection.getSection(), 8);
      $screenshareSec.insertAfter(chatSection.getSection()); // 위치 변경
      isSwitchSectionOn = true;
      showSection();
    });

    $('.cancelScreenModal').click(function() {
      $('#screenModal').hide();
      closeScreenshare();
    });

    calleeEmplId = calleeId;
  }

  function fullScreen(video) {
    var video = document.getElementById('peer-video');

    if (video.requestFullscreen) {
    	video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
    	video.webkitRequestFullscreen();
    } else if (video.mozRequestFullScreen) {
    	video.mozRequestFullScreen();
    } else if (video.msRequestFullscreen) {
    	video.msRequestFullscreen();
    }
  }

  function loadScreenshareSection() {
    loadHtml("./html/screenshare/screenshare.html", $("#screenshare-section"));
  }

  function showSection() {
    $screenshareSec.show();
  }

  function hideSection() {
    $screenshareSec.hide();
  }

  function getSection() {
    return $screenshareSec;
  }

  return {
    initScreenshareSection: initScreenshareSection,
    showDialog: showDialog,
    loadScreenshareSection: loadScreenshareSection,
    showSection: showSection,
    getSection: getSection,
    hideSection: hideSection
  };
})();

module.exports = screenshareSection;
