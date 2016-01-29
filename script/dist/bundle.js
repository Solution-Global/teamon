/* String prototype */
String.prototype.string = function(len) {
  var s = '',
    i = 0;
  while (i++ < len) {
    s += this;
  }
  return s;
};
String.prototype.zf = function(len) {
  return "0".string(len - this.length) + this;
};

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/* Number prototype */
Number.prototype.zf = function(len) {
  return this.toString().zf(len);
};

/* Date prototype */
Date.prototype.format = function(f) {
  if (!this.valueOf()) return " ";

  var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  var d = this;

  return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
    switch ($1) {
      case "yyyy":
        return d.getFullYear();
      case "yy":
        return (d.getFullYear() % 1000).zf(2);
      case "MM":
        return (d.getMonth() + 1).zf(2);
      case "dd":
        return d.getDate().zf(2);
      case "E":
        return weekName[d.getDay()];
      case "HH":
        return d.getHours().zf(2);
      case "hh":
        return ((h = d.getHours() % 12) ? h : 12).zf(2);
      case "mm":
        return d.getMinutes().zf(2);
      case "ss":
        return d.getSeconds().zf(2);
      case "a/p":
        return d.getHours() < 12 ? "오전" : "오후";
      default:
        return $1;
    }
  });
};

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
var remote = require('remote');
var path = require('path');
var storageManager = require('../script/module/storage/storage_manager.js')(true);
var preference = require('../script/module/storage/preference.js');
var messageManager = require('../script/module/storage/message.js');
function initialize() {
  require('../script/module/teamon_menu').customMenus();

  bindEvents();
  $(window).resize();
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

function initScreenSection() {
  // local에 저장되지 않는 message들 모두 laod
  messageManager = messageManager(storageManager, myPref);
  messageManager.syncChatMessage();

  connSection.initConnSection(myPref, chatSection, asideSection);
  chatSection.initChatSection(myPref, connSection, asideSection);
  asideSection.initAsideSection(myPref, connSection, chatSection);
}

function loginSubmit() {
  var loginIdObj = $("#loginForm").find("[name=loginId]");
  var passwordObj = $("#loginForm").find("[name=password]");
  var companyObj = $("#loginForm").find("[name=company]");
  var rememberMe = $("#loginForm").find("[name=rememberMe]");
  var params = {
    "company": companyObj.val(),
    "loginId": loginIdObj.val(),
    "password": passwordObj.val(),
  }

  restResourse.login.login(params,
    function(data) {

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

      $("#dialog").dialog("close");
    });
}

function bindEvents() {

  // adjust height when resize
  function _resize() {
    var headerHeight = $(".header_section").outerHeight(true);
    var chatInputHeight = $(".chat_section .ibox-footer").outerHeight(true);
    var asideHeaderHeight =  $(".aside_section .ibox-title").outerHeight(true);
    var connectHeaderHeight = $(".connection_section .nav-header").outerHeight(true);
    var connectChannelsHeight = $(".connection_section .channels-link").outerHeight(true);
    var connectUsersHeight = $(".connection_section .users-link").outerHeight(true);
    var defaultHeight = 3;

    var scrollHeight = $(window).height() - connectHeaderHeight - connectChannelsHeight - connectUsersHeight - defaultHeight;
    var chatHeight =  $(window).height() - headerHeight - chatInputHeight - defaultHeight;
    var asideHeight =  $(window).height() - headerHeight - asideHeaderHeight - defaultHeight;

    $('.connection_section .chat-channels').css('height', scrollHeight * 0.3 );
    $('.connection_section .chat-users').css('height', scrollHeight * 0.7 );

    $('.chat_section .content_area').css('height', chatHeight);
    $('.aside_section .content_area').css('height', asideHeight);
  }

  _resize(); // run fist time basically
  $(window).resize(function() {
    _resize();
  });

  $(window).on('beforeunload', function() {
    console.log("Closing window");
    chatSection.finalize();
  });

  // Close ibox function
  $('.aside_section .aside-close-link').click(function() {
    adjustAsideArea();
  });

  $('.header_section .call-menulink').click(function() {
    adjustAsideArea(true);
  });

  // bind login Modal event
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

  $('#loginModal .sign-in').click(function() {
    loginSubmit();
  });

}

function loginSubmit() {
  if(!$("#loginForm").valid())
    return;

  var loginIdObj = $("#loginForm").find("[name=loginId]");
  var passwordObj = $("#loginForm").find("[name=password]");
  var companyObj = $("#loginForm").find("[name=company]");
  var rememberMe = $("#loginForm").find("[name=rememberMe]");
  var params = {
    "company": companyObj.val(),
    "loginId": loginIdObj.val(),
    "password": passwordObj.val(),
  }

  restResourse.login.login(params,
    function(data) {
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

function adjustAsideArea(isOpen) {
  var chatSection = $('.chat_section');
  var asideIbox = $(".aside_section .ibox");
  if(isOpen || chatSection.hasClass("col-xs-12 col-lg-12")) {
    chatSection.removeClass("col-xs-12 col-lg-12").addClass( "col-xs-9 col-lg-9" );
    asideIbox.show(500);
  } else {
    chatSection.removeClass("col-xs-9 col-lg-9").addClass( "col-xs-12 col-lg-12" );
    asideIbox.hide();
  }
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

var emplResource = require("../script/module/rest/empl");
var loginResource = require("../script/module/rest/login");
var chatResource = require("../script/module/rest/chat");

var restResourse = {
  empl : new emplResource(),
  login : new loginResource(),
  chat : new chatResource(),
};
