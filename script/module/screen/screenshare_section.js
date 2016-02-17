'use strict';

var remote = require('remote');
var screen = require ('screen');
var BrowserWindow = remote.require("browser-window");
var myWindow = remote.getCurrentWindow();
var app = remote.require('app');
var desktopCapturer = require('electron').desktopCapturer;

var desktopSharing = false;
var localStream = null;
var dispSize = screen.getPrimaryDisplay().size;
var calleeEmplId = null;
var desktopStream = null;
var peer;
var call;

var $screenshareSec;

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

    // Receiving a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      console.log('got a call!! from ' + calleeEmplId);

      $('.screenshare_section').show();
      $('.information_section').hide();
      desktopSharing = true;
      call.answer(window.localStream);
      displayScreen(call);
    });

    peer.on('error', function(err){
      alert(err.message);
      // Return to step 2 if error occurs
    });

    peer.on('close', function(){
      hideSection();
      chatSection.showSection();
      informationSection.showSection();
    });
  }

  function closeScreenshare()
  {
    hideSection();
    chatSection.showSection();
    informationSection.showSection();
    desktopSharing = false;
  }

  function displayScreen (call) {
    // Hang up on an existing call if present
    if (window.existingCall) {
      window.existingCall.close();
    }

    // Wait for stream on the call, then set peer video display
    call.on('stream', function(stream){
      initilizeButtons();
      chatSection.hideSection();
      callSection.hideSection();
      informationSection.hideSection();
      showSection();

      $('#peer-video').prop('src', URL.createObjectURL(stream));
      $('#my-video').hide();
    });

    // UI stuff
    window.existingCall = call;
    call.on('close', closeScreenshare);
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

      if (localStream) {
        localStream.getTracks().forEach(function (track) { track.stop(); });
      }
      localStream = null;

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
      console.log('gotStream');
      window.localStream = stream;
      call = peer.call(calleeEmplId, window.localStream);
      $('#my-video').prop('src', URL.createObjectURL(stream));
      $('#peer-video').hide();

      stream.onended = function() {
        if (desktopSharing) {
          toggle();
        }
      };

      call.on('close', closeScreenshare);
      chatSection.hideSection();
      callSection.hideSection();
      informationSection.hideSection();
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
      console.log('cancelScreenShare');
      //window.existingCall.close();
      hideSection();
      chatSection.showSection();
      informationSection.showSection();

      if (window.existingCall) {
        window.existingCall.close();
      }

      if (!peer.disconnected) {
        peer.destroy();
      }
    });
  }

  function showDialog(calleeId) {
    openModalDialog("./html/screenshare/popup/screenshare_popup.html");
    var calleeObj = catalogSection.getUserObj(calleeId);
    var calleeName = (calleeObj !== null) ? calleeObj.loginId : calleeId;
    console.log('Screen share to ' + calleeName + ' , calleeId : ' + calleeId);

    initilizeButtons();
    informationSection.hideSection();
    $('select').empty();
    showSources();
    $('#screenModal').show();

    $('.enableScreenCapture').click(function() {
      toggle();
      $('#screenModal').hide();
    });

    $('.cancelScreenModal').click(function() {
      $('#screenModal').hide();
      hideSection();
      chatSection.showSection();
      informationSection.showSection();
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

  return {
    initScreenshareSection: initScreenshareSection,
    showDialog: showDialog,
    loadScreenshareSection: loadScreenshareSection,
    showSection: showSection,
    hideSection: hideSection
  };
})();

module.exports = screenshareSection;
