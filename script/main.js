window.$ = window.jQuery = require('jquery');
require('jquery-ui');
require('bootstrap');
require('metismenu');
require('malihu-custom-scrollbar-plugin')($);
var Mustache = require('mustache');
// var chat = require('../script/module/chat.js');
var connSection = require('../script/module/screen/conn_section.js');
var chatSection = require('../script/module/screen/chat_section.js');
var asideSection = require('../script/module/screen/aside_section.js');
var callSection = require('../script/module/screen/call_section.js');
var headerSection = require('../script/module/screen/header_section.js');

var remote = require('remote');
var path = require('path');
var storageManager = require('../script/module/storage/storage_manager.js')(false);
var preference = require('../script/module/storage/preference.js');
var messageManager = require('../script/module/storage/message.js');

function initialize() {
  require('../script/module/teamon_menu').customMenus();

  bindEvents();
  windowResize();
  initCustomScrollbar();
  initLoginStatus();
}

var myPref;

function initLoginStatus() {
  var remeberEmplId = storageManager.getValue("remeberEmplId");
  console.log("initLoginStatus[remeberEmplId:%s]", remeberEmplId);

  if(remeberEmplId) {
    preference = preference(storageManager, remeberEmplId); // init preference

    myPref = {
      "company": preference.getPerference("company"),
      "loginId": preference.getPerference("loginId"),
      "emplId": Number(remeberEmplId),
      "coId": preference.getPerference("coId")
    };

    initScreenSection();
  } else {
    $('#loginModal').modal('show');
  }
}

function loginSubmit() {
  var loginForm = $("#loginForm");
  if(!loginForm.valid())
    return;

  var loginIdObj = loginForm.find("[name=loginId]");
  var passwordObj = loginForm.find("[name=password]");
  var companyObj = loginForm.find("[name=company]");
  var rememberMe = loginForm.find("[name=rememberMe]");
  var params = {
    "company": companyObj.val(),
    "loginId": loginIdObj.val(),
    "password": passwordObj.val(),
  };

  restResourse.login.login(params,
  function(data) {
    if(!data.emplId) {
      console.error("login Fail!!");
      return;
    }

    myPref = {
      "company": params.company,
      "loginId": params.loginId,
      "emplId": data.emplId ? Number(data.emplId) : null,
      "coId": data.coId ? Number(data.coId) : null
    };

    initScreenSection();
    // set the personal pref info first to use it around the app.
    preference = preference(storageManager, data.emplId); // init preference
    if(rememberMe.is(":checked"))
      storageManager.setValue("remeberEmplId", data.emplId);
    preference.setPerference("company", params.company);
    preference.setPerference("loginId", params.loginId);
    preference.setPerference("emplId", data.emplId);
    preference.setPerference("coId", data.coId); // Save to the pref file once at the end of the config job.

    $("#loginModal").modal("hide");
  });
}

function initScreenSection() {
  connSection.initConnSection(myPref, chatSection, asideSection);
  chatSection.initChatSection(myPref, connSection, asideSection, headerSection);
  asideSection.initAsideSection(myPref, callSection);
  callSection.initCallSection(myPref);
  headerSection.initHeaderSection(myPref, asideSection);
}

function windowResize() {
  var $header_section = $(".header_section");
  var $chat_section = $(".chat_section");
  var $aside_section = $(".aside_section");
  var $connection_section = $(".connection_section");

  // adjust height when resize
  function _resize() {
    var windowHeight = $(window).height();

    var headerHeight = $header_section.outerHeight(true);
    var chatInputHeight = $chat_section.find(".ibox-footer").outerHeight(true);
    var asideHeaderHeight =  $aside_section.find(".ibox-title").outerHeight(true);
    var connectHeaderHeight = $connection_section.find(".nav-header").outerHeight(true);
    var connectChannelsHeight = $connection_section.find(".channels-link").outerHeight(true);
    var connectUsersHeight = $connection_section.find(".users-link").outerHeight(true);
    var defaultHeight = 3;

    // 마지막의 3,2,1 오차 pixel.
    var scrollHeight = windowHeight - connectHeaderHeight - connectChannelsHeight - connectUsersHeight - 3;
    var asideHeight =  windowHeight - headerHeight - asideHeaderHeight - 2;
    var chatHeight =  windowHeight - headerHeight - chatInputHeight - 1;

    $connection_section.find(".chat-channels").css("height", scrollHeight * 0.3 );
    $connection_section.find(".chat-users").css("height", scrollHeight * 0.7 );

    $chat_section.find(".content_area").css("height", chatHeight);
    $aside_section.find(".ibox-content").css("height", asideHeight);
  }

  _resize(); // run first time basically
  $(window).resize(function() {
    _resize();
  });
}

function bindEvents() {
  $(window).on('beforeunload', function() {
    console.log("Closing window");
    chatSection.finalize();
  });

  // set validation for login Form
  $("#loginForm").validate({
    rules: {
      company: {
        required: true,
        minlength: 6
      },
      loginId: {
        required: true,
        minlength: 4
      },
      password: {
        required: true,
        minlength: 6
      }
    }
  });

  // set event for login action
  $('#loginModal .sign-in').click(function() {
    loginSubmit();
  });
}

function initCustomScrollbar() {
  $('.chat_section .content_area').mCustomScrollbar({
    axis:"y",
    setWidth: "auto",
    theme:"3d",
    callbacks:{
      onScroll:function(){
        if(this.mcs.top === 0) {
          chatSection.getPreviousMessage(this.mcs.draggerTop);
        }
      }
    },
    onTotalScrollOffset:100,
    alwaysTriggerOffsets:false
  }).mCustomScrollbar("scrollTo", "bottom");

  $('.aside_section .content_area').mCustomScrollbar({
    axis:"y",
		setWidth: "auto",
    theme:"3d",
  });

  var scrollHeight = $(window).height() - 230;
  $('.connection_section .chat-channels').mCustomScrollbar({
    axis:"y",
		setWidth: "auto",
    setHeight:  scrollHeight * 0.3,
    theme:"3d",
  });

  $('.connection_section .chat-users').mCustomScrollbar({
    axis:"y",
		setWidth: "auto",
    setHeight:  scrollHeight * 0.7,
    theme:"3d"
  });
}

$(document).ready(function() {
  initialize();
});
